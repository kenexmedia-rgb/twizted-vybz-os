import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const companyId =
    typeof body?.company_id === 'string' ? body.company_id.trim() : '';
  const role = typeof body?.role === 'string' ? body.role.trim() : '';

  if (!email || !companyId || !role) {
    return NextResponse.json(
      { error: 'email, company_id, and role are required' },
      { status: 400 }
    );
  }

  if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
    return NextResponse.json(
      { error: 'role must be owner, admin, member, or viewer' },
      { status: 400 }
    );
  }

  const { data: inviter, error: inviterError } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', auth.user.id)
    .single();

  if (inviterError || !inviter) {
    return NextResponse.json(
      { error: 'Authenticated user profile not found' },
      { status: 403 }
    );
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id, organization_id')
    .eq('id', companyId)
    .eq('organization_id', inviter.organization_id)
    .single();

  if (companyError || !company) {
    return NextResponse.json(
      { error: 'Company not found in your organization' },
      { status: 404 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get('origin') ??
    request.nextUrl.origin;
  const redirectTo = `${origin}/auth/set-password`;

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo,
      data: {
        company_id: company.id,
        organization_id: company.organization_id,
        role
      }
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { user: data.user, message: 'Invitation sent' },
    { status: 201 }
  );
}
