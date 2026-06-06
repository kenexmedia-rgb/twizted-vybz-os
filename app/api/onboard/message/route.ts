import { NextRequest, NextResponse } from 'next/server';
import { getBearerToken } from '@/lib/auth';
import {
  BudgetExceededError,
  callModel,
  getModelText
} from '@/lib/model';
import { fillOnboardingPrompt } from '@/lib/onboarding/prompts';
import {
  parseKnownFields,
  parseMessages,
  parseUserType
} from '@/lib/onboarding/validation';
import { createSupabaseClient, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const messages = parseMessages(body?.messages);
  const requestedUserType = parseUserType(body?.user_type);
  const knownFields = parseKnownFields(body?.known_fields);

  if (!messages || !requestedUserType) {
    return NextResponse.json(
      { error: 'messages and user_type (owner or salespro) are required' },
      { status: 400 }
    );
  }

  let system = fillOnboardingPrompt({
    userType: requestedUserType,
    knownFields,
    entryChannel:
      typeof body?.entry_channel === 'string' ? body.entry_channel : 'web',
    accountStatus: 'pre-signup'
  });

  const token = getBearerToken(request);
  let modelContext: {
    user_id?: string | null;
    organization_id?: string | null;
    company_id?: string | null;
  } = {};

  if (token) {
    const {
      data: { user }
    } = await createSupabaseClient(token).auth.getUser(token);

    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select(
          'id, organization_id, company_id, kai_system_prompt, user_type'
        )
        .eq('id', user.id)
        .single();

      if (profile?.kai_system_prompt) {
        system = profile.kai_system_prompt;
      } else {
        system = fillOnboardingPrompt({
          userType: requestedUserType,
          knownFields: {
            email: knownFields.email ?? user.email,
            name: knownFields.name
          },
          entryChannel:
            typeof body?.entry_channel === 'string'
              ? body.entry_channel
              : 'web',
          accountStatus: 'signed-in'
        });
      }

      if (profile) {
        modelContext = {
          user_id: profile.id,
          organization_id: profile.organization_id,
          company_id: profile.company_id
        };
      }
    }
  }

  try {
    const response = await callModel({
      system,
      messages,
      context: {
        ...modelContext,
        endpoint_name: '/api/onboard/message'
      }
    });
    return NextResponse.json({ reply: getModelText(response), usage: response.usage });
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Claude request failed' },
      { status: 502 }
    );
  }
}
