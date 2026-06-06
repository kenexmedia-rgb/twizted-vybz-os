import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  DISCOVERY_COMPLETE_MARKER,
  discoverySystemPrompt,
  ensureDiscoverySession,
  getDiscoveryProfile,
  loadDiscoverySession,
  loadFoundation,
  logDiscoveryError,
  parseOrganizationalTruths,
  saveDiscoveryHistory,
  saveOrganizationalTruths,
  truthGenerationPrompt
} from '@/lib/discovery';
import { BudgetExceededError, getModelText, streamModel } from '@/lib/model';
import type { ConversationMessage } from '@/lib/onboarding/types';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 300;

type DiscoveryAction = 'start' | 'resume' | 'message' | 'retry_generation';

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function actionInstruction(action: DiscoveryAction) {
  if (action === 'start') {
    return 'Continue seamlessly from onboarding. Open warmly and specifically from the foundation context, then invite the owner deeper with one natural question.';
  }

  if (action === 'resume') {
    return 'The owner has returned after a pause. Acknowledge that warmly in one brief sentence, demonstrate continuity with one specific detail from the thread, and pick up with the next natural question. Do not recap everything.';
  }

  return '';
}

async function authenticatedContext(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response || !auth.user) {
    return { response: auth.response };
  }

  const profile = await getDiscoveryProfile(auth.user.id);

  if (!profile) {
    return {
      response: NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    };
  }

  if (profile.user_type !== 'owner') {
    return {
      response: NextResponse.json(
        { error: 'Discovery is available to business owners only' },
        { status: 403 }
      )
    };
  }

  const foundation = await loadFoundation(profile);

  if (!foundation) {
    return {
      response: NextResponse.json(
        { error: 'Complete onboarding before starting discovery' },
        { status: 409 }
      )
    };
  }

  return { auth, profile, foundation, response: null };
}

export async function GET(request: NextRequest) {
  try {
    const context = await authenticatedContext(request);

    if (context.response) {
      return context.response;
    }

    if (!context.profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const [session, truths] = await Promise.all([
      loadDiscoverySession(context.profile.organization_id),
      supabaseAdmin
        .from('org_truths')
        .select(
          'brand_foundation, business_truth, human_truth, brand_voice, core_services, faq, business_plan, website_copy, image_people_rules, status, updated_at'
        )
        .eq('org_id', context.profile.organization_id)
        .maybeSingle()
    ]);

    if (truths.error) {
      throw new Error(`Unable to load organizational truths: ${truths.error.message}`);
    }

    return NextResponse.json({
      session,
      truths: truths.data,
      should_resume: session?.status === 'in_progress' && session.conversation_history.length > 0,
      should_start: !session || session.conversation_history.length === 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load discovery' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let context;

  try {
    context = await authenticatedContext(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load discovery' },
      { status: 500 }
    );
  }

  if (context.response) {
    return context.response;
  }

  if (!context.profile || !context.foundation) {
    return NextResponse.json(
      { error: 'Discovery context is unavailable' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const action = body?.action as DiscoveryAction;
  const content = typeof body?.content === 'string' ? body.content.trim() : '';

  if (!['start', 'resume', 'message', 'retry_generation'].includes(action)) {
    return NextResponse.json({ error: 'A valid action is required' }, { status: 400 });
  }

  if (action === 'message' && !content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  let session;

  try {
    session =
      (await loadDiscoverySession(context.profile.organization_id)) ??
      (await ensureDiscoverySession(context.profile.organization_id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to initialize discovery' },
      { status: 500 }
    );
  }

  if (session.status === 'complete' && action !== 'retry_generation') {
    return NextResponse.json(
      { error: 'Discovery is already complete' },
      { status: 409 }
    );
  }

  let history = session.conversation_history;

  if (action === 'message') {
    history = [...history, { role: 'user', content }];

    try {
      session = await saveDiscoveryHistory(session.id, history);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unable to save message' },
        { status: 500 }
      );
    }
  }

  const encoder = new TextEncoder();
  const profile = context.profile;
  const foundation = context.foundation;
  const sessionId = session.id;
  const orgId = profile.organization_id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      const generateTruths = async () => {
        let generated = '';
        send('phase', { phase: 'generating_truths' });

        const response = await streamModel(
          {
            system: truthGenerationPrompt(profile, foundation),
            messages: [
              ...history,
              {
                role: 'user',
                content:
                  '[Generate the complete set of organizational truth documents now.]'
              }
            ],
            max_tokens: 16000,
            context: {
              user_id: profile.id,
              organization_id: orgId,
              company_id: profile.company_id,
              endpoint_name: '/api/discovery:truths'
            }
          },
          {
            onText(text) {
              generated += text;
              send('truth_delta', { text });
            }
          }
        );

        generated = getModelText(response);
        const truths = parseOrganizationalTruths(generated);
        await saveOrganizationalTruths(orgId, sessionId, truths);
        send('complete', { status: 'complete', truths });
      };

      try {
        if (action === 'retry_generation') {
          if (history.length === 0) {
            throw new Error('There is no discovery conversation to generate from');
          }

          await generateTruths();
          controller.close();
          return;
        }

        const modelMessages: ConversationMessage[] =
          action === 'message'
            ? history
            : [
                ...history,
                {
                  role: 'user',
                  content: `[Internal continuation instruction: ${actionInstruction(action)}]`
                }
              ];
        let assistantText = '';
        let pending = '';

        send('phase', { phase: 'conversation' });
        await streamModel(
          {
            system: discoverySystemPrompt(profile, foundation),
            messages: modelMessages,
            max_tokens: 1800,
            context: {
              user_id: profile.id,
              organization_id: orgId,
              company_id: profile.company_id,
              endpoint_name: '/api/discovery:conversation'
            }
          },
          {
            onText(text) {
              assistantText += text;
              pending += text;

              if (pending.length > DISCOVERY_COMPLETE_MARKER.length) {
                const visible = pending.slice(
                  0,
                  pending.length - DISCOVERY_COMPLETE_MARKER.length
                );
                pending = pending.slice(-DISCOVERY_COMPLETE_MARKER.length);
                send('delta', { text: visible });
              }
            }
          }
        );

        const interviewComplete = assistantText
          .trimEnd()
          .endsWith(DISCOVERY_COMPLETE_MARKER);
        const cleanAssistantText = assistantText
          .replace(DISCOVERY_COMPLETE_MARKER, '')
          .trim();
        const remainingVisible = pending.replace(DISCOVERY_COMPLETE_MARKER, '');

        if (remainingVisible) {
          send('delta', { text: remainingVisible });
        }

        history = [
          ...history,
          { role: 'assistant', content: cleanAssistantText }
        ];
        await saveDiscoveryHistory(sessionId, history);
        send('turn_saved', { interview_complete: interviewComplete });

        if (interviewComplete) {
          await generateTruths();
        }
      } catch (error) {
        if (action === 'retry_generation' || history.at(-1)?.role === 'assistant') {
          await logDiscoveryError(profile, error);
        }

        send('error', {
          error:
            error instanceof BudgetExceededError
              ? 'Monthly AI usage limit reached'
              : error instanceof Error
                ? error.message
                : 'Discovery failed',
          retryable: true,
          retry_action:
            action === 'retry_generation' ||
            history.at(-1)?.role === 'assistant'
              ? 'retry_generation'
              : 'resume'
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
}
