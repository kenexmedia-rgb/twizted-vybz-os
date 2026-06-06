import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, supabaseAdmin } from '@/lib/supabase';

export type SessionScope = {
  organization_id: string;
  company_id: string | null;
  role: 'org_owner' | 'company_owner' | 'company_member';
  is_billable_seat: boolean;
  can_switch_company: boolean;
};

export function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
}

export async function requireSession(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Missing bearer session token' },
        { status: 401 }
      )
    };
  }

  const {
    data: { user },
    error
  } = await createSupabaseClient(token).auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Invalid or expired session token' },
        { status: 401 }
      )
    };
  }

  return { user, response: null };
}

export async function getSessionScope(authUserId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('user_id', authUserId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: memberships, error } = await supabaseAdmin
    .from('company_users')
    .select('organization_id, company_id, role, is_billable_seat')
    .eq('user_id', profile.id)
    .order('created_at');

  if (error || !memberships?.length) {
    return null;
  }

  const orgOwner = memberships.find(
    (membership) => membership.role === 'org_owner'
  );
  const membership = orgOwner ?? memberships[0];

  return {
    organization_id: membership.organization_id,
    company_id: orgOwner ? null : membership.company_id,
    role: membership.role,
    is_billable_seat: membership.is_billable_seat,
    can_switch_company: Boolean(orgOwner)
  } satisfies SessionScope;
}
