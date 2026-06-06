-- Organizational truths discovery storage. Additive changes only.

CREATE TABLE IF NOT EXISTS public.org_truths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id),
  brand_foundation text,
  business_truth text,
  human_truth text,
  brand_voice text,
  core_services text,
  faq text,
  business_plan text,
  website_copy text,
  image_people_rules text,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discovery_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id),
  conversation_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_organizational_truths_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS touch_org_truths_updated_at ON public.org_truths;
CREATE TRIGGER touch_org_truths_updated_at
  BEFORE UPDATE ON public.org_truths
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_organizational_truths_updated_at();

DROP TRIGGER IF EXISTS touch_discovery_sessions_updated_at
  ON public.discovery_sessions;
CREATE TRIGGER touch_discovery_sessions_updated_at
  BEFORE UPDATE ON public.discovery_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_organizational_truths_updated_at();

ALTER TABLE public.org_truths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_discovery_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.users
  WHERE user_id = auth.uid()
     OR (user_id IS NULL AND id = auth.uid())
  ORDER BY (user_id = auth.uid()) DESC
  LIMIT 1
$$;

DROP POLICY IF EXISTS org_truths_org_isolation ON public.org_truths;
CREATE POLICY org_truths_org_isolation
  ON public.org_truths
  FOR ALL
  USING (org_id = public.current_discovery_organization_id())
  WITH CHECK (org_id = public.current_discovery_organization_id());

DROP POLICY IF EXISTS discovery_sessions_org_isolation
  ON public.discovery_sessions;
CREATE POLICY discovery_sessions_org_isolation
  ON public.discovery_sessions
  FOR ALL
  USING (org_id = public.current_discovery_organization_id())
  WITH CHECK (org_id = public.current_discovery_organization_id());

GRANT SELECT, INSERT, UPDATE ON TABLE public.org_truths TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.discovery_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.org_truths TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.discovery_sessions TO service_role;

REVOKE ALL ON FUNCTION public.touch_organizational_truths_updated_at()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_discovery_organization_id()
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_discovery_organization_id()
  TO authenticated;
