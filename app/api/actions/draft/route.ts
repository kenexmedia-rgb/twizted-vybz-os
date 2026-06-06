import { NextRequest, NextResponse } from 'next/server';
import { getSessionScope, requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const title = optionalText(body?.title);
  const reasoning = optionalText(body?.reasoning);
  const source = optionalText(body?.source);
  const confidenceScore = body?.confidence_score;

  if (
    !title ||
    !reasoning ||
    !source ||
    typeof confidenceScore !== 'number' ||
    !Number.isFinite(confidenceScore) ||
    confidenceScore < 0 ||
    confidenceScore > 1
  ) {
    return NextResponse.json(
      {
        error:
          'title, reasoning, source, and confidence_score from 0.0 to 1.0 are required'
      },
      { status: 400 }
    );
  }

  const [scope, profileResult] = await Promise.all([
    getSessionScope(auth.user.id),
    supabaseAdmin
      .from('users')
      .select('id, organization_id, company_id')
      .eq('user_id', auth.user.id)
      .single()
  ]);

  if (!scope || profileResult.error || !profileResult.data) {
    return NextResponse.json(
      { error: 'User profile not found for this session' },
      { status: 403 }
    );
  }

  const requestedCompanyId =
    body?.company_id === null ? null : optionalText(body?.company_id);
  const companyId = scope.can_switch_company
    ? requestedCompanyId
    : profileResult.data.company_id;

  if (scope.can_switch_company && body?.company_id === undefined) {
    return NextResponse.json(
      { error: 'company_id (uuid or null) is required for an org owner' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.rpc('route_kai_action', {
    target_user_id: profileResult.data.id,
    target_company_id: companyId,
    target_agent_key: optionalText(body?.agent_key) ?? 'kai',
    target_title: title,
    target_type: optionalText(body?.type),
    target_recipient: optionalText(body?.recipient),
    target_draft: optionalText(body?.draft),
    target_amount: optionalText(body?.amount),
    target_confidence_score: confidenceScore,
    target_reasoning: reasoning,
    target_source: source
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, {
    status: data?.route === 'approval' ? 202 : 200
  });
}
