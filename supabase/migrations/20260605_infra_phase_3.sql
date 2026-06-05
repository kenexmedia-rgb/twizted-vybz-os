-- Phase 3 model usage, budgets, and infrastructure telemetry.
-- Additive changes only.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'budget_plan_tier'
  ) THEN
    CREATE TYPE public.budget_plan_tier AS ENUM (
      'kai',
      'starter',
      'growth',
      'autonomy'
    );
  END IF;
END;
$$;

ALTER TABLE public.agent_logs
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS endpoint_name text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS input_tokens bigint,
  ADD COLUMN IF NOT EXISTS output_tokens bigint,
  ADD COLUMN IF NOT EXISTS cached_tokens bigint;

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid REFERENCES public.companies(id),
  model text NOT NULL,
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  cached_tokens bigint NOT NULL DEFAULT 0,
  cache_creation_tokens bigint NOT NULL DEFAULT 0,
  cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_tier public.budget_plan_tier NOT NULL DEFAULT 'starter',
  monthly_token_limit bigint NOT NULL,
  monthly_message_limit bigint NOT NULL,
  current_month_tokens bigint NOT NULL DEFAULT 0,
  current_month_messages bigint NOT NULL DEFAULT 0,
  reset_date timestamptz NOT NULL,
  warning_sent_at timestamptz,
  hard_stop_logged_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_budgets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usage_logs'
      AND policyname = 'usage_logs_owner_read'
  ) THEN
    CREATE POLICY usage_logs_owner_read ON public.usage_logs FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_budgets'
      AND policyname = 'user_budgets_owner_read'
  ) THEN
    CREATE POLICY user_budgets_owner_read ON public.user_budgets FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.plan_token_limit(plan text)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE plan
    WHEN 'kai' THEN 100000
    WHEN 'starter' THEN 500000
    WHEN 'growth' THEN 2000000
    WHEN 'autonomy' THEN 10000000
    ELSE 500000
  END;
$$;

CREATE OR REPLACE FUNCTION public.plan_message_limit(plan text)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE plan
    WHEN 'kai' THEN 1000
    WHEN 'starter' THEN 5000
    WHEN 'growth' THEN 20000
    WHEN 'autonomy' THEN 100000
    ELSE 5000
  END;
$$;

INSERT INTO public.user_budgets (
  user_id,
  plan_tier,
  monthly_token_limit,
  monthly_message_limit,
  reset_date
)
SELECT
  id,
  CASE
    WHEN email = 'tony@twiztedvybz.com'
      THEN 'autonomy'::public.budget_plan_tier
    WHEN plan_tier = 'growth'
      THEN 'growth'::public.budget_plan_tier
    WHEN plan_tier = 'kai'
      THEN 'kai'::public.budget_plan_tier
    ELSE 'starter'::public.budget_plan_tier
  END,
  public.plan_token_limit(
    CASE WHEN email = 'tony@twiztedvybz.com' THEN 'autonomy'
         ELSE COALESCE(plan_tier, 'starter') END
  ),
  public.plan_message_limit(
    CASE WHEN email = 'tony@twiztedvybz.com' THEN 'autonomy'
         ELSE COALESCE(plan_tier, 'starter') END
  ),
  date_trunc('month', now()) + interval '1 month'
FROM public.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_user_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_plan text;
BEGIN
  selected_plan := COALESCE(new.plan_tier, 'starter');

  INSERT INTO public.user_budgets (
    user_id,
    plan_tier,
    monthly_token_limit,
    monthly_message_limit,
    reset_date
  )
  VALUES (
    new.id,
    CASE selected_plan
      WHEN 'kai' THEN 'kai'::public.budget_plan_tier
      WHEN 'growth' THEN 'growth'::public.budget_plan_tier
      WHEN 'autonomy' THEN 'autonomy'::public.budget_plan_tier
      ELSE 'starter'::public.budget_plan_tier
    END,
    public.plan_token_limit(selected_plan),
    public.plan_message_limit(selected_plan),
    date_trunc('month', now()) + interval '1 month'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_public_user_budget_created'
      AND tgrelid = 'public.users'::regclass
  ) THEN
    CREATE TRIGGER on_public_user_budget_created
      AFTER INSERT ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION public.create_user_budget();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_user_budget_usage(
  target_user_id uuid,
  token_increment bigint,
  message_increment bigint
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.user_budgets
  SET current_month_tokens = current_month_tokens + token_increment,
      current_month_messages = current_month_messages + message_increment,
      updated_at = now()
  WHERE user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.log_budget_warnings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  logged_count integer;
BEGIN
  WITH candidates AS (
    UPDATE public.user_budgets b
    SET warning_sent_at = now(), updated_at = now()
    WHERE warning_sent_at IS NULL
      AND (
        b.current_month_tokens >= b.monthly_token_limit * 0.8 OR
        b.current_month_messages >= b.monthly_message_limit * 0.8
      )
      AND b.current_month_tokens < b.monthly_token_limit
      AND b.current_month_messages < b.monthly_message_limit
    RETURNING b.user_id
  ), inserted AS (
    INSERT INTO public.agent_logs (
      user_id, organization_id, agent_name, action, result,
      event_type, endpoint_name
    )
    SELECT
      c.user_id, u.organization_id, 'budget_monitor',
      'budget_warning', '80_percent', 'budget_warning',
      '/api/cron/budget-warning'
    FROM candidates c
    JOIN public.users u ON u.id = c.user_id
    RETURNING 1
  )
  SELECT count(*) INTO logged_count FROM inserted;

  RETURN logged_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_budget_hard_stops()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  logged_count integer;
BEGIN
  WITH candidates AS (
    UPDATE public.user_budgets b
    SET hard_stop_logged_at = now(), updated_at = now()
    WHERE hard_stop_logged_at IS NULL
      AND (
        b.current_month_tokens >= b.monthly_token_limit OR
        b.current_month_messages >= b.monthly_message_limit
      )
    RETURNING b.user_id
  ), inserted AS (
    INSERT INTO public.agent_logs (
      user_id, organization_id, agent_name, action, result,
      event_type, endpoint_name
    )
    SELECT
      c.user_id, u.organization_id, 'budget_monitor',
      'budget_hard_stop', '100_percent', 'budget_hard_stop',
      '/api/cron/enforce-budgets'
    FROM candidates c
    JOIN public.users u ON u.id = c.user_id
    RETURNING 1
  )
  SELECT count(*) INTO logged_count FROM inserted;

  RETURN logged_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_daily_usage_summary()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  logged_count integer;
BEGIN
  WITH inserted AS (
    INSERT INTO public.agent_logs (
      user_id, organization_id, agent_name, action, result,
      event_type, endpoint_name
    )
    SELECT
      b.user_id,
      u.organization_id,
      'usage_monitor',
      'daily_usage_summary',
      json_build_object(
        'tokens', b.current_month_tokens,
        'messages', b.current_month_messages,
        'plan', b.plan_tier
      )::text,
      'daily_usage_summary',
      '/api/cron/daily-summary'
    FROM public.user_budgets b
    JOIN public.users u ON u.id = b.user_id
    RETURNING 1
  )
  SELECT count(*) INTO logged_count FROM inserted;

  RETURN logged_count;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE public.agent_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.usage_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_budgets TO service_role;
GRANT SELECT ON TABLE public.organizations TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_user_budget_usage(uuid, bigint, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_budget_warnings() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_budget_hard_stops() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_daily_usage_summary() TO service_role;
