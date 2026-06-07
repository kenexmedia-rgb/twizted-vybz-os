-- Task 19: turn-based voice calls and temporary Spark budget placeholders.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS voice_id text,
  ADD COLUMN IF NOT EXISTS phone_number text;

CREATE UNIQUE INDEX IF NOT EXISTS companies_phone_number_key
  ON public.companies (phone_number)
  WHERE phone_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text NOT NULL UNIQUE,
  direction text NOT NULL,
  from_number text,
  to_number text,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_calls_direction_check
    CHECK (direction IN ('inbound', 'outbound')),
  CONSTRAINT voice_calls_status_check
    CHECK (status IN ('in_progress', 'completed', 'failed')),
  CONSTRAINT voice_calls_conversation_array_check
    CHECK (jsonb_typeof(conversation) = 'array')
);

CREATE INDEX IF NOT EXISTS voice_calls_organization_company_idx
  ON public.voice_calls (organization_id, company_id);
CREATE INDEX IF NOT EXISTS voice_calls_status_updated_idx
  ON public.voice_calls (status, updated_at DESC);

ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS voice_calls_org_scope ON public.voice_calls;
CREATE POLICY voice_calls_org_scope
  ON public.voice_calls
  FOR ALL
  TO authenticated
  USING (public.has_company_access(organization_id, company_id))
  WITH CHECK (public.has_company_access(organization_id, company_id));

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.voice_calls
  TO authenticated;
GRANT SELECT, INSERT, UPDATE
  ON TABLE public.voice_calls
  TO service_role;

-- Spark limits are placeholders only. They intentionally match the current
-- lowest tier (Kai) until product defines Spark's permanent limits.
CREATE OR REPLACE FUNCTION public.plan_token_limit(plan text)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE plan
    WHEN 'spark' THEN 100000
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
SET search_path = ''
AS $$
  SELECT CASE plan
    WHEN 'spark' THEN 1000
    WHEN 'kai' THEN 1000
    WHEN 'starter' THEN 5000
    WHEN 'growth' THEN 20000
    WHEN 'autonomy' THEN 100000
    ELSE 5000
  END;
$$;

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
      WHEN 'spark' THEN 'spark'::public.budget_plan_tier
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

REVOKE ALL ON FUNCTION public.create_user_budget()
  FROM PUBLIC, anon, authenticated;
