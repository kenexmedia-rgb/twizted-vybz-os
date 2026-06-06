import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { getSessionScope } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'email and password are required' },
      { status: 400 }
    );
  }

  const { data, error } = await createSupabaseClient().auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? 'Unable to create session' },
      { status: 401 }
    );
  }

  const scope = await getSessionScope(data.user.id);

  return NextResponse.json({
    user: data.user,
    token: data.session.access_token,
    scope,
    session: {
      ...data.session,
      scope
    }
  });
}
