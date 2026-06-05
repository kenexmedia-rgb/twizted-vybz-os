import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: 'name, email, and a password of at least 8 characters are required' },
      { status: 400 }
    );
  }

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  const { data, error } = await createSupabaseClient().auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    if (created.user) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Unable to create session' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      user: data.user,
      token: data.session.access_token,
      session: data.session
    },
    { status: 201 }
  );
}
