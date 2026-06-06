import { NextRequest, NextResponse } from 'next/server';
import {
  autonomyRpcError,
  parseAutonomyLevel,
  requireAutonomyProfile
} from '@/lib/autonomy';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const autonomyLevel = parseAutonomyLevel(body?.autonomy_level);
  const confirmedAt =
    typeof body?.confirmed_at === 'string' ? body.confirmed_at.trim() : '';
  const confirmedDate = new Date(confirmedAt);

  if (!autonomyLevel || !confirmedAt || Number.isNaN(confirmedDate.getTime())) {
    return NextResponse.json(
      {
        error:
          'autonomy_level must be ask_me_first, assist, or robotaxi; confirmed_at must be an ISO timestamp'
      },
      { status: 400 }
    );
  }

  const scope = await requireAutonomyProfile(
    request,
    body?.user_id,
    body?.company_id
  );

  if (scope.response) {
    return scope.response;
  }

  const { data, error } = await supabaseAdmin.rpc('log_autonomy_consent', {
    target_user_id: scope.profile.id,
    target_company_id: scope.profile.company_id,
    target_autonomy_level: autonomyLevel,
    target_confirmed_at: confirmedDate.toISOString()
  });

  if (error) {
    return autonomyRpcError(error.message);
  }

  return NextResponse.json(
    {
      event_type: 'autonomy_consent',
      autonomy_level: autonomyLevel,
      confirmed_at: confirmedDate.toISOString(),
      log: data
    },
    { status: 201 }
  );
}

