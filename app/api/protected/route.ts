import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    authenticated: true,
    user_id: auth.user.id,
    email: auth.user.email
  });
}
