import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const AUTONOMY_LEVELS = [
  'ask_me_first',
  'assist',
  'robotaxi'
] as const;

export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export function parseAutonomyLevel(value: unknown): AutonomyLevel | null {
  return typeof value === 'string' &&
    AUTONOMY_LEVELS.includes(value as AutonomyLevel)
    ? (value as AutonomyLevel)
    : null;
}

export async function requireAutonomyProfile(
  request: NextRequest,
  submittedUserId: unknown,
  submittedCompanyId: unknown
) {
  const auth = await requireSession(request);

  if (auth.response) {
    return { profile: null, response: auth.response };
  }

  const userId =
    typeof submittedUserId === 'string' ? submittedUserId.trim() : '';
  const companyId =
    submittedCompanyId === null
      ? null
      : typeof submittedCompanyId === 'string'
        ? submittedCompanyId.trim()
        : undefined;

  if (!userId || companyId === undefined) {
    return {
      profile: null,
      response: NextResponse.json(
        { error: 'user_id and company_id (uuid or null) are required' },
        { status: 400 }
      )
    };
  }

  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id, user_id, organization_id, company_id, autonomy_level')
    .eq('id', userId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      profile: null,
      response: NextResponse.json(
        { error: 'User profile not found for this session' },
        { status: 403 }
      )
    };
  }

  if (companyId !== profile.company_id) {
    return {
      profile: null,
      response: NextResponse.json(
        { error: 'company_id does not match the authenticated user profile' },
        { status: 403 }
      )
    };
  }

  return { profile, response: null };
}

export function autonomyRpcError(message: string) {
  const isConsentError = message.includes('Prior autonomy consent');
  const isConflict = message.includes('Autonomy level changed');

  return NextResponse.json(
    { error: message },
    { status: isConsentError ? 403 : isConflict ? 409 : 400 }
  );
}

