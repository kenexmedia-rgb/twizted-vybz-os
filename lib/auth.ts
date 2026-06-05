import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

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
