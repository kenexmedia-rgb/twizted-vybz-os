import { NextRequest, NextResponse } from 'next/server';
import { getSessionScope, requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
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

  let query = supabaseAdmin
    .from('approvals')
    .select(
      'id, user_id, company_id, title, agent, type, recipient, draft, amount, status, confidence_score, reasoning, source, low_confidence, created_at'
    )
    .eq('organization_id', scope.organization_id)
    .order('created_at', { ascending: false });

  if (scope.user_type === 'salespro') {
    query = query.eq('user_id', profileResult.data.id);
  } else if (!scope.can_switch_company && scope.company_id) {
    query = query.eq('company_id', scope.company_id);
  }

  const status = request.nextUrl.searchParams.get('status');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ approvals: data ?? [] });
}
