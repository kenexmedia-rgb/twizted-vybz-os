import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  const nextReset = new Date();
  nextReset.setUTCMonth(nextReset.getUTCMonth() + 1, 1);
  nextReset.setUTCHours(0, 0, 0, 0);

  const { error } = await supabaseAdmin
    .from('user_budgets')
    .update({
      current_month_tokens: 0,
      current_month_messages: 0,
      warning_sent_at: null,
      hard_stop_logged_at: null,
      reset_date: nextReset.toISOString(),
      updated_at: new Date().toISOString()
    })
    .lte('reset_date', new Date().toISOString());

  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ reset: true });
}
