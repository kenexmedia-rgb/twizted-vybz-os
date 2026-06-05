import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type WindowCounter = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  minute: Map<string, WindowCounter>;
  day: Map<string, WindowCounter>;
};

const globalRateLimit = globalThis as typeof globalThis & {
  rateLimitStore?: RateLimitStore;
};

const store =
  globalRateLimit.rateLimitStore ??
  (globalRateLimit.rateLimitStore = {
    minute: new Map(),
    day: new Map()
  });

function incrementWindow(
  map: Map<string, WindowCounter>,
  key: string,
  durationMs: number
) {
  const now = Date.now();
  const existing = map.get(key);

  if (!existing || existing.resetAt <= now) {
    const counter = { count: 1, resetAt: now + durationMs };
    map.set(key, counter);
    return counter;
  }

  existing.count += 1;
  return existing;
}

async function logRateLimitHit({
  endpoint,
  userId
}: {
  endpoint: string;
  userId?: string | null;
}) {
  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  try {
    const organizations = await fetch(
      `${supabaseUrl}/rest/v1/organizations?select=id&order=created_at.asc&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`
        }
      }
    );
    const [{ id: organizationId } = { id: null }] =
      (await organizations.json()) as Array<{ id: string }>;

    if (!organizationId) {
      return;
    }

    await fetch(`${supabaseUrl}/rest/v1/agent_logs`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId ?? null,
        organization_id: organizationId,
        agent_name: 'rate_limiter',
        action: 'rate_limit_exceeded',
        result: 'blocked',
        event_type: 'rate_limit',
        endpoint_name: endpoint
      })
    });
  } catch {
    // Rate limiting must still work if telemetry is temporarily unavailable.
  }
}

function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retry_after: retryAfter },
    {
      status: 429,
      headers: { 'retry-after': String(retryAfter) }
    }
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');
  const isCron = pathname.startsWith('/api/cron/');
  const isPublic =
    pathname === '/api/onboard/message' ||
    pathname === '/api/transcribe' ||
    isCron;
  let userId: string | null = null;

  if (authorization?.startsWith('Bearer ') && !isCron) {
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

    userId = ((await response.json()) as { id?: string }).id ?? null;
  } else if (!isPublic) {
    return NextResponse.json(
      { error: 'Missing bearer session token' },
      { status: 401 }
    );
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const minuteLimit = userId ? 60 : 20;
  const minuteCounter = incrementWindow(
    store.minute,
    key,
    60 * 1000
  );

  if (minuteCounter.count > minuteLimit) {
    const retryAfter = Math.max(
      1,
      Math.ceil((minuteCounter.resetAt - Date.now()) / 1000)
    );
    await logRateLimitHit({ endpoint: pathname, userId });
    return rateLimitResponse(retryAfter);
  }

  if (userId) {
    const dayCounter = incrementWindow(
      store.day,
      key,
      24 * 60 * 60 * 1000
    );

    if (dayCounter.count > 1000) {
      const retryAfter = Math.max(
        1,
        Math.ceil((dayCounter.resetAt - Date.now()) / 1000)
      );
      await logRateLimitHit({ endpoint: pathname, userId });
      return rateLimitResponse(retryAfter);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
