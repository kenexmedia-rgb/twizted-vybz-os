import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/anthropic';
import { getBearerToken } from '@/lib/auth';
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

  if (token) {
    const {
      data: { user }
    } = await createSupabaseClient(token).auth.getUser(token);

    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('kai_system_prompt, user_type')
        .eq('id', user.id)
        .single();

      if (profile?.kai_system_prompt) {
        system = profile.kai_system_prompt;
      } else {
        system = fillOnboardingPrompt({
          userType: parseUserType(profile?.user_type) ?? requestedUserType,
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
    }
  }

  try {
    const reply = await callClaude({ system, messages });
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Claude request failed' },
      { status: 502 }
    );
  }
}
