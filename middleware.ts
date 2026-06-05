import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api/auth/') ||
    request.nextUrl.pathname === '/api/onboard/message'
  ) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing bearer session token' },
      { status: 401 }
    );
  }

  if (!supabaseUrl || !supabaseAnonKey?.startsWith('eyJ')) {
    return NextResponse.json(
      { error: 'Supabase authentication is not configured' },
      { status: 500 }
    );
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      authorization
    }
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Invalid or expired session token' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
