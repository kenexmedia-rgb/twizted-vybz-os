import { NextRequest, NextResponse } from 'next/server';
import {
  autonomyRpcError,
  parseAutonomyLevel,
  requireAutonomyProfile
} from '@/lib/autonomy';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const oldLevel = parseAutonomyLevel(body?.old_level);
  const newLevel = parseAutonomyLevel(body?.new_level);

  if (!oldLevel || !newLevel) {
    return NextResponse.json(
      {
        error:
          'old_level and new_level must be ask_me_first, assist, or robotaxi'
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

  const { data, error } = await supabaseAdmin.rpc('set_autonomy_level', {
    target_user_id: scope.profile.id,
    target_company_id: scope.profile.company_id,
    target_old_level: oldLevel,
    target_new_level: newLevel
  });

  if (error) {
    return autonomyRpcError(error.message);
  }

  return NextResponse.json({
    event_type: 'autonomy_change',
    old_level: oldLevel,
    new_level: newLevel,
    log: data
  });
}

