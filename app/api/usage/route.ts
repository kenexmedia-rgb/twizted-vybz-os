import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);

  if (auth.response) {
    return auth.response;
  }

  const { data: budget, error } = await supabaseAdmin
    .from('user_budgets')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!budget) {
    return NextResponse.json(
      { error: 'Usage budget not found' },
      { status: 404 }
    );
  }

  const tokenPercentage =
    budget.monthly_token_limit > 0
      ? (budget.current_month_tokens / budget.monthly_token_limit) * 100
      : 0;
  const messagePercentage =
    budget.monthly_message_limit > 0
      ? (budget.current_month_messages / budget.monthly_message_limit) * 100
      : 0;

  return NextResponse.json({
    plan_tier: budget.plan_tier,
    tokens_used: budget.current_month_tokens,
    messages_used: budget.current_month_messages,
    token_limit: budget.monthly_token_limit,
    message_limit: budget.monthly_message_limit,
    token_percentage: Number(tokenPercentage.toFixed(2)),
    message_percentage: Number(messagePercentage.toFixed(2)),
    percentage_consumed: Number(
      Math.max(tokenPercentage, messagePercentage).toFixed(2)
    ),
    reset_date: budget.reset_date
  });
}
