-- Confidence routing and show-the-work approvals.
-- Additive changes only.

ALTER TABLE public.approvals
  ADD COLUMN IF NOT EXISTS confidence_score double precision,
  ADD COLUMN IF NOT EXISTS reasoning text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS low_confidence boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'approvals_confidence_score_check'
      AND conrelid = 'public.approvals'::regclass
  ) THEN
    ALTER TABLE public.approvals
      ADD CONSTRAINT approvals_confidence_score_check
      CHECK (
        confidence_score IS NULL
        OR confidence_score BETWEEN 0.0 AND 1.0
      )
      NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.approvals
  VALIDATE CONSTRAINT approvals_confidence_score_check;

CREATE TABLE IF NOT EXISTS public.agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid REFERENCES public.companies(id),
  agent_key text,
  high_threshold double precision NOT NULL DEFAULT 0.85,
  review_threshold double precision NOT NULL DEFAULT 0.60,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_config_thresholds_check CHECK (
    review_threshold BETWEEN 0.0 AND 1.0
    AND high_threshold BETWEEN 0.0 AND 1.0
    AND review_threshold <= high_threshold
  ),
  CONSTRAINT agent_config_scope_key
    UNIQUE NULLS NOT DISTINCT (organization_id, company_id, agent_key)
);

INSERT INTO public.agent_config (
  organization_id,
  company_id,
  agent_key,
  high_threshold,
  review_threshold
)
SELECT id, NULL, NULL, 0.85, 0.60
FROM public.organizations
WHERE slug = 'twizted-vybz'
ON CONFLICT (organization_id, company_id, agent_key)
  DO NOTHING;

CREATE INDEX IF NOT EXISTS agent_config_lookup_idx
  ON public.agent_config (organization_id, company_id, agent_key);

ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS confidence_routing_agent_config
  ON public.agent_config;

CREATE POLICY confidence_routing_agent_config
  ON public.agent_config FOR ALL TO authenticated
  USING (
    public.is_org_owner(organization_id)
    OR (
      company_id IS NOT NULL
      AND public.has_company_access(organization_id, company_id)
    )
  )
  WITH CHECK (
    public.is_org_owner(organization_id)
    OR (
      company_id IS NOT NULL
      AND public.has_company_access(organization_id, company_id)
    )
  );

GRANT SELECT, INSERT, UPDATE ON TABLE public.agent_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.agent_config TO service_role;

CREATE OR REPLACE FUNCTION public.touch_agent_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS touch_agent_config_updated_at
  ON public.agent_config;

CREATE TRIGGER touch_agent_config_updated_at
  BEFORE UPDATE ON public.agent_config
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_agent_config_updated_at();

CREATE OR REPLACE FUNCTION public.route_kai_action(
  target_user_id uuid,
  target_company_id uuid,
  target_agent_key text,
  target_title text,
  target_type text,
  target_recipient text,
  target_draft text,
  target_amount text,
  target_confidence_score double precision,
  target_reasoning text,
  target_source text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile public.users;
  thresholds public.agent_config;
  approval_row public.approvals;
  log_row public.agent_logs;
  route text;
  is_low_confidence boolean := false;
BEGIN
  IF target_title IS NULL OR btrim(target_title) = '' THEN
    RAISE EXCEPTION 'title is required';
  END IF;

  IF target_confidence_score IS NULL
     OR target_confidence_score < 0.0
     OR target_confidence_score > 1.0 THEN
    RAISE EXCEPTION 'confidence_score must be between 0.0 and 1.0';
  END IF;

  IF target_reasoning IS NULL OR btrim(target_reasoning) = '' THEN
    RAISE EXCEPTION 'reasoning is required';
  END IF;

  IF target_source IS NULL OR btrim(target_source) = '' THEN
    RAISE EXCEPTION 'source is required';
  END IF;

  SELECT *
    INTO profile
    FROM public.users
   WHERE id = target_user_id
   FOR SHARE;

  IF profile.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_company_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.companies
       WHERE id = target_company_id
         AND organization_id = profile.organization_id
     ) THEN
    RAISE EXCEPTION 'Company scope does not match user organization';
  END IF;

  SELECT *
    INTO thresholds
    FROM public.agent_config
   WHERE organization_id = profile.organization_id
     AND (company_id IS NULL OR company_id = target_company_id)
     AND (agent_key IS NULL OR agent_key = target_agent_key)
   ORDER BY
     (company_id IS NOT NULL)::integer DESC,
     (agent_key IS NOT NULL)::integer DESC,
     updated_at DESC
   LIMIT 1;

  IF thresholds.id IS NULL THEN
    RAISE EXCEPTION
      'No agent_config threshold row exists for organization %',
      profile.organization_id;
  END IF;

  IF profile.autonomy_level = 'ask_me_first' THEN
    route := 'approval';
  ELSIF profile.autonomy_level = 'assist' THEN
    IF target_confidence_score >= thresholds.high_threshold THEN
      route := 'auto_execute';
    ELSE
      route := 'approval';
      is_low_confidence :=
        target_confidence_score < thresholds.review_threshold;
    END IF;
  ELSIF profile.autonomy_level = 'robotaxi' THEN
    IF target_confidence_score >= thresholds.review_threshold THEN
      route := 'auto_execute';
    ELSE
      route := 'approval';
      is_low_confidence := true;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid autonomy level: %', profile.autonomy_level;
  END IF;

  IF route = 'approval' THEN
    INSERT INTO public.approvals (
      user_id,
      organization_id,
      company_id,
      title,
      agent,
      type,
      recipient,
      draft,
      amount,
      status,
      confidence_score,
      reasoning,
      source,
      low_confidence
    )
    VALUES (
      profile.id,
      profile.organization_id,
      target_company_id,
      target_title,
      COALESCE(NULLIF(target_agent_key, ''), 'kai'),
      target_type,
      target_recipient,
      target_draft,
      target_amount,
      'pending',
      target_confidence_score,
      target_reasoning,
      target_source,
      is_low_confidence
    )
    RETURNING * INTO approval_row;
  ELSE
    INSERT INTO public.agent_logs (
      user_id,
      organization_id,
      company_id,
      agent_name,
      action,
      result,
      event_type,
      endpoint_name,
      autonomy_level_at_action
    )
    VALUES (
      profile.id,
      profile.organization_id,
      target_company_id,
      COALESCE(NULLIF(target_agent_key, ''), 'kai'),
      'customer_facing_action_auto_executed',
      jsonb_build_object(
        'title', target_title,
        'type', target_type,
        'recipient', target_recipient,
        'draft', target_draft,
        'amount', target_amount,
        'confidence_score', target_confidence_score,
        'reasoning', target_reasoning,
        'source', target_source,
        'owner_notified', true
      )::text,
      'customer_facing_action',
      '/api/actions/draft',
      profile.autonomy_level
    )
    RETURNING * INTO log_row;
  END IF;

  RETURN jsonb_build_object(
    'route', route,
    'autonomy_level', profile.autonomy_level,
    'high_threshold', thresholds.high_threshold,
    'review_threshold', thresholds.review_threshold,
    'low_confidence', is_low_confidence,
    'approval_id', approval_row.id,
    'agent_log_id', log_row.id,
    'owner_notified', route = 'auto_execute'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.touch_agent_config_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.route_kai_action(
  uuid, uuid, text, text, text, text, text, text,
  double precision, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.route_kai_action(
  uuid, uuid, text, text, text, text, text, text,
  double precision, text, text
) TO service_role;
