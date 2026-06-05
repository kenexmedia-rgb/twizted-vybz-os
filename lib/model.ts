import { supabaseAdmin } from '@/lib/supabase';
import type { ConversationMessage } from '@/lib/onboarding/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const DEFAULT_MODEL = 'claude-sonnet-4-6';

export type ModelUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
};

export type ModelResponse = {
  id: string;
  model: string;
  content: Array<{
    type: string;
    text?: string;
  }>;
  usage: ModelUsage;
  stop_reason?: string | null;
};

export class BudgetExceededError extends Error {
  constructor() {
    super('Monthly AI usage limit reached');
    this.name = 'BudgetExceededError';
  }
}

type ModelContext = {
  user_id?: string | null;
  organization_id?: string | null;
  company_id?: string | null;
  endpoint_name: string;
};

type CallModelOptions = {
  model?: string;
  system: string;
  messages: ConversationMessage[];
  max_tokens?: number;
  context: ModelContext;
  [key: string]: unknown;
};

function calculateCost(model: string, usage: ModelUsage) {
  const inputRate = model.includes('sonnet') ? 3 : 3;
  const outputRate = model.includes('sonnet') ? 15 : 15;
  const cacheReadRate = inputRate * 0.1;
  const cacheWriteRate = inputRate * 1.25;

  return (
    (usage.input_tokens * inputRate +
      usage.output_tokens * outputRate +
      (usage.cache_read_input_tokens ?? 0) * cacheReadRate +
      (usage.cache_creation_input_tokens ?? 0) * cacheWriteRate) /
    1_000_000
  );
}

async function getDefaultOrganizationId() {
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .order('created_at')
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

async function checkBudget(userId?: string | null) {
  if (!userId) {
    return;
  }

  const { data: budget } = await supabaseAdmin
    .from('user_budgets')
    .select(
      'monthly_token_limit, monthly_message_limit, current_month_tokens, current_month_messages'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (
    budget &&
    (budget.current_month_tokens >= budget.monthly_token_limit ||
      budget.current_month_messages >= budget.monthly_message_limit)
  ) {
    throw new BudgetExceededError();
  }
}

async function logSuccessfulCall({
  response,
  context
}: {
  response: ModelResponse;
  context: ModelContext;
}) {
  const cachedTokens = response.usage.cache_read_input_tokens ?? 0;
  const totalTokens =
    response.usage.input_tokens +
    response.usage.output_tokens +
    cachedTokens +
    (response.usage.cache_creation_input_tokens ?? 0);
  const organizationId =
    context.organization_id ?? (await getDefaultOrganizationId());
  const costUsd = calculateCost(response.model, response.usage);

  if (!organizationId) {
    throw new Error('No organization is available for usage logging');
  }

  const { error: usageError } = await supabaseAdmin.from('usage_logs').insert({
    user_id: context.user_id ?? null,
    organization_id: organizationId,
    company_id: context.company_id ?? null,
    model: response.model,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cached_tokens: cachedTokens,
    cache_creation_tokens: response.usage.cache_creation_input_tokens ?? 0,
    cost_usd: costUsd,
    endpoint: context.endpoint_name
  });

  if (usageError) {
    throw new Error(`Unable to write usage log: ${usageError.message}`);
  }

  const { error: agentLogError } = await supabaseAdmin
    .from('agent_logs')
    .insert({
      user_id: context.user_id ?? null,
      organization_id: organizationId,
      agent_name: 'model_gateway',
      action: 'model_call',
      result: 'success',
      event_type: 'model_call',
      endpoint_name: context.endpoint_name,
      model: response.model,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cached_tokens: cachedTokens
    });

  if (agentLogError) {
    throw new Error(`Unable to write agent log: ${agentLogError.message}`);
  }

  if (context.user_id) {
    const { error: budgetError } = await supabaseAdmin.rpc(
      'increment_user_budget_usage',
      {
        target_user_id: context.user_id,
        token_increment: totalTokens,
        message_increment: 1
      }
    );

    if (budgetError) {
      throw new Error(`Unable to update budget: ${budgetError.message}`);
    }
  }
}

export async function callModel(options: CallModelOptions) {
  const {
    model = DEFAULT_MODEL,
    system,
    messages,
    max_tokens = 1200,
    context,
    ...standardOptions
  } = options;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  await checkBudget(context.user_id);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      ...standardOptions,
      model,
      max_tokens,
      system: [
        {
          type: 'text',
          text: system,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages
    }),
    cache: 'no-store'
  });
  const payload = (await response.json()) as ModelResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Claude API failed with ${response.status}`
    );
  }

  await logSuccessfulCall({ response: payload, context });
  return payload;
}

export function getModelText(response: ModelResponse) {
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Claude returned no text content');
  }

  return text;
}
