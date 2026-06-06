-- Website Antigravity prompt generation storage. Additive changes only.

CREATE TABLE IF NOT EXISTS public.website_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id),
  generated_copy text,
  seo_schema jsonb,
  assembled_prompt text,
  delivery_target text NOT NULL DEFAULT 'drive'
    CHECK (delivery_target IN ('drive', 'chat', 'antigravity')),
  delivery_ref text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'validated', 'delivered', 'error')),
  validation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reference_site_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_key text NOT NULL UNIQUE,
  reference_sites text[] NOT NULL,
  notes text
);

INSERT INTO public.reference_site_map (industry_key, reference_sites, notes)
VALUES
  (
    'finance',
    ARRAY[
      'https://www.blackstone.com',
      'https://www.blackrock.com',
      'https://privatewealth.brookfield.com'
    ],
    'Premium finance and private-capital reference set.'
  ),
  (
    'real_estate',
    ARRAY[
      'https://www.tesla.com/modely',
      'https://www.tesla.com/autopilot'
    ],
    'High-clarity product storytelling reference set.'
  ),
  (
    'healthcare',
    ARRAY['https://www.tesla.com/modely'],
    'Minimal structural reference set.'
  )
ON CONFLICT (industry_key) DO UPDATE
SET reference_sites = EXCLUDED.reference_sites,
    notes = EXCLUDED.notes;

DROP TRIGGER IF EXISTS touch_website_prompts_updated_at
  ON public.website_prompts;
CREATE TRIGGER touch_website_prompts_updated_at
  BEFORE UPDATE ON public.website_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_organizational_truths_updated_at();

ALTER TABLE public.website_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_site_map ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_website_user_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT user_type
  FROM public.users
  WHERE user_id = auth.uid()
     OR (user_id IS NULL AND id = auth.uid())
  ORDER BY (user_id = auth.uid()) DESC
  LIMIT 1
$$;

DROP POLICY IF EXISTS website_prompts_org_isolation
  ON public.website_prompts;
CREATE POLICY website_prompts_org_isolation
  ON public.website_prompts
  FOR ALL
  TO authenticated
  USING (
    org_id = public.current_discovery_organization_id()
    AND public.current_website_user_type() = 'owner'
  )
  WITH CHECK (
    org_id = public.current_discovery_organization_id()
    AND public.current_website_user_type() = 'owner'
  );

DROP POLICY IF EXISTS reference_site_map_authenticated_read
  ON public.reference_site_map;
CREATE POLICY reference_site_map_authenticated_read
  ON public.reference_site_map
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON TABLE public.website_prompts FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.reference_site_map FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.website_prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.website_prompts TO service_role;
GRANT SELECT ON TABLE public.reference_site_map TO authenticated;
GRANT SELECT ON TABLE public.reference_site_map TO service_role;

REVOKE ALL ON FUNCTION public.current_website_user_type() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_website_user_type() TO authenticated;
