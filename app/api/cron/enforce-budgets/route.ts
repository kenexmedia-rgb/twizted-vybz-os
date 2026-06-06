import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin.rpc('log_budget_hard_stops');

  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ hard_stops_logged: data ?? 0 });
}
