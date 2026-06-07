import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  getDiscoveryProfile,
  type OrganizationalTruths
} from '@/lib/discovery';
import { BudgetExceededError } from '@/lib/model';
import { supabaseAdmin } from '@/lib/supabase';
import { deliverPrompt, type DeliveryTarget } from '@/lib/website/deliver';
import {
  assembleWebsitePrompt,
  deriveMapRule,
  ensureWebsitePrompt,
  generateSeoSchema,
  generateWebsiteCopy,
  loadReferenceSites,
  logWebsiteError,
  updateWebsitePrompt,
  validateAssembledPrompt
} from '@/lib/website/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 300;

const TRUTH_SELECTION =
  'brand_foundation, business_truth, human_truth, brand_voice, core_services, faq, business_plan, website_copy, image_people_rules, status';

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function parseTarget(value: unknown): DeliveryTarget | null {
  return value === 'drive' || value === 'chat' || value === 'antigravity'
    ? value
    : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response || !auth.user) {
    return auth.response;
  }

  let profile;

  try {
    profile = await getDiscoveryProfile(auth.user.id);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to load user profile'
      },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  if (profile.user_type !== 'owner') {
    return NextResponse.json(
      { error: 'Website generation is available to business owners only' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsedTarget = parseTarget(body.delivery_target);

  if (body.delivery_target !== undefined && !parsedTarget) {
    return NextResponse.json(
      { error: 'delivery_target must be drive, chat, or antigravity' },
      { status: 400 }
    );
  }

  const requestedTarget: DeliveryTarget | undefined =
    body.delivery_target === undefined ? undefined : parsedTarget ?? undefined;
  const { data: truthRow, error: truthError } = await supabaseAdmin
    .from('org_truths')
    .select(TRUTH_SELECTION)
    .eq('org_id', profile.organization_id)
    .maybeSingle();

  if (truthError) {
    return NextResponse.json(
      { error: `Unable to load organizational truths: ${truthError.message}` },
      { status: 500 }
    );
  }

  if (!truthRow || truthRow.status !== 'complete') {
    return NextResponse.json(
      { error: 'Organizational truths must be complete before website generation' },
      { status: 409 }
    );
  }

  const {
    status: _truthStatus,
    ...truthValues
  } = truthRow as OrganizationalTruths & { status: string };
  const truths = truthValues as OrganizationalTruths;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };
      let stage = 'initialize';
      let persistedNotes: string | null = null;

      try {
        let promptRow = await ensureWebsitePrompt(
          profile.organization_id,
          requestedTarget
        );
        persistedNotes = promptRow.validation_notes;

        if (
          promptRow.status === 'delivered' &&
          !requestedTarget
        ) {
          send('complete', {
            status: 'delivered',
            delivery_target: promptRow.delivery_target,
            delivery_ref: promptRow.delivery_ref,
            validation_notes: promptRow.validation_notes,
            resumed: true
          });
          return;
        }

        promptRow = await updateWebsitePrompt(profile.organization_id, {
          status: 'generating'
        });

        if (!promptRow.generated_copy) {
          stage = 'copy';
          send('phase', { phase: 'generating_copy' });
          const generatedCopy = await generateWebsiteCopy(profile, truths);
          promptRow = await updateWebsitePrompt(profile.organization_id, {
            generated_copy: generatedCopy
          });
          send('phase_complete', { phase: 'generating_copy' });
        } else {
          send('phase', { phase: 'generating_copy', resumed: true });
        }

        const generatedCopy = promptRow.generated_copy;

        if (!generatedCopy) {
          throw new Error('Stage 1 copy was not persisted');
        }

        if (!promptRow.seo_schema) {
          stage = 'seo_schema';
          send('phase', { phase: 'generating_seo_schema' });
          const seoSchema = await generateSeoSchema(
            profile,
            truths,
            generatedCopy
          );
          promptRow = await updateWebsitePrompt(profile.organization_id, {
            seo_schema: seoSchema
          });
          send('phase_complete', { phase: 'generating_seo_schema' });
        } else {
          send('phase', { phase: 'generating_seo_schema', resumed: true });
        }

        const seoSchema = promptRow.seo_schema;

        if (!seoSchema) {
          throw new Error('Stage 2 SEO/schema was not persisted');
        }

        stage = 'assembly';
        send('phase', {
          phase: 'assembling_prompt',
          resumed: Boolean(promptRow.assembled_prompt)
        });
        const references = await loadReferenceSites(profile.industry);
        const mapRule = deriveMapRule(truths);

        if (!promptRow.assembled_prompt) {
          const assembledPrompt = assembleWebsitePrompt({
            profile,
            truths,
            generatedCopy,
            seoSchema,
            referenceSites: references.sites,
            mapRule
          });
          promptRow = await updateWebsitePrompt(profile.organization_id, {
            assembled_prompt: assembledPrompt
          });
          send('phase_complete', { phase: 'assembling_prompt' });
        }

        const assembledPrompt = promptRow.assembled_prompt;

        if (!assembledPrompt) {
          throw new Error('Stage 3 assembled prompt was not persisted');
        }

        stage = 'validation';
        send('phase', { phase: 'validating_prompt' });
        const validation = validateAssembledPrompt({
          prompt: assembledPrompt,
          truths,
          industry: profile.industry,
          referenceMapped: references.mapped,
          referenceSites: references.sites
        });
        persistedNotes = validation.notes;
        promptRow = await updateWebsitePrompt(profile.organization_id, {
          validation_notes: validation.notes,
          status: validation.valid ? 'validated' : 'error'
        });
        send('validation', {
          valid: validation.valid,
          failures: validation.failures,
          notes: validation.notes
        });

        stage = 'delivery';
        send('phase', {
          phase: 'delivering_prompt',
          target: promptRow.delivery_target
        });
        const delivery = await deliverPrompt(
          profile.organization_id,
          assembledPrompt,
          promptRow.delivery_target
        );
        const finalStatus =
          validation.valid && delivery.notice !== 'drive_not_configured'
            ? 'delivered'
            : validation.valid
              ? 'validated'
              : 'error';
        promptRow = await updateWebsitePrompt(profile.organization_id, {
          status: finalStatus,
          delivery_ref: delivery.deliveryRef
        });
        send('delivery', {
          target: promptRow.delivery_target,
          notice: delivery.notice,
          delivery_ref: delivery.deliveryRef,
          content: delivery.content
        });
        send('complete', {
          status: finalStatus,
          delivery_target: promptRow.delivery_target,
          delivery_ref: promptRow.delivery_ref,
          validation_notes: promptRow.validation_notes
        });
      } catch (error) {
        const message =
          error instanceof BudgetExceededError
            ? 'Monthly AI usage limit reached'
            : error instanceof Error
              ? error.message
              : 'Website prompt generation failed';

        await updateWebsitePrompt(profile.organization_id, {
          status: 'error',
          validation_notes: [
            persistedNotes,
            `PIPELINE ERROR [${stage}]: ${message}`
          ]
            .filter(Boolean)
            .join('\n')
        }).catch(() => null);
        await logWebsiteError(profile, stage, error);
        send('error', {
          error: message,
          stage,
          retryable: true
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
