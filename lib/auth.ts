import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, supabaseAdmin } from '@/lib/supabase';

export type SessionScope = {
  organization_id: string;
  company_id: string | null;
  role: 'org_owner' | 'company_owner' | 'company_member' | null;
  user_type: 'owner' | 'salespro';
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
    .select('id, organization_id, company_id, user_type')
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

  if (error) {
    return null;
  }

  if (!memberships?.length) {
    return {
      organization_id: profile.organization_id,
      company_id: profile.user_type === 'salespro' ? null : profile.company_id,
      role: null,
      user_type: profile.user_type,
      is_billable_seat: false,
      can_switch_company: false
    } satisfies SessionScope;
  }

  const orgOwner = memberships.find(
    (membership) => membership.role === 'org_owner'
  );
  const membership = orgOwner ?? memberships[0];

  return {
    organization_id: membership.organization_id,
    company_id: orgOwner ? null : membership.company_id,
    role: membership.role,
    user_type: profile.user_type,
    is_billable_seat: membership.is_billable_seat,
    can_switch_company:
      profile.user_type === 'owner' && Boolean(orgOwner)
  } satisfies SessionScope;
}
