-- Multi-tenant migration for Twizted Vybz OS / AcaiOS
-- Applied LIVE to Supabase project zdswstwqiuqmfdmgxmzx on 2026-06-04.
-- This file is the version-control record only. It is idempotent/replay-safe,
-- but the change is ALREADY LIVE in production — do not re-apply to prod.

-- 1. organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'starter',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. org #1 (Tony Terry / Twizted Vybz)
INSERT INTO public.organizations (name, slug, plan)
VALUES ('Tony Terry / Twizted Vybz', 'twizted-vybz', 'growth')
ON CONFLICT (slug) DO NOTHING;

-- 3. organization_id (nullable) on all existing tables
ALTER TABLE public.users         ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.leads         ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.approvals     ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.tasks         ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.agent_logs    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 4. backfill existing rows to org #1 (referenced by slug for replay safety)
UPDATE public.users         SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') WHERE organization_id IS NULL;
UPDATE public.leads         SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') WHERE organization_id IS NULL;
UPDATE public.approvals     SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') WHERE organization_id IS NULL;
UPDATE public.conversations SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') WHERE organization_id IS NULL;
UPDATE public.tasks         SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') WHERE organization_id IS NULL;
UPDATE public.agent_logs    SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') WHERE organization_id IS NULL;

-- 5. lock organization_id NOT NULL
ALTER TABLE public.users         ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.leads         ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.approvals     ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.tasks         ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.agent_logs    ALTER COLUMN organization_id SET NOT NULL;

-- 6. new tables
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  slug text UNIQUE,
  industry text,
  logo_url text,
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid REFERENCES public.companies(id),
  name text NOT NULL,
  type text,
  config jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid REFERENCES public.companies(id),
  agent_name text,
  title text,
  body text,
  status text DEFAULT 'drafted',
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid REFERENCES public.companies(id),
  lead_id uuid REFERENCES public.leads(id),
  status text DEFAULT 'active',
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- company_id + is_seed on existing data tables
ALTER TABLE public.leads         ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.leads         ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;
ALTER TABLE public.approvals     ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.approvals     ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;
ALTER TABLE public.tasks         ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.tasks         ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;

-- 7. dormant RLS (inactive until Supabase Auth; service-role key bypasses RLS)
ALTER TABLE public.organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequences      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_organizations ON public.organizations;
CREATE POLICY org_isolation_organizations ON public.organizations FOR ALL
  USING (id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_users ON public.users;
CREATE POLICY org_isolation_users ON public.users FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_leads ON public.leads;
CREATE POLICY org_isolation_leads ON public.leads FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_approvals ON public.approvals;
CREATE POLICY org_isolation_approvals ON public.approvals FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_conversations ON public.conversations;
CREATE POLICY org_isolation_conversations ON public.conversations FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_tasks ON public.tasks;
CREATE POLICY org_isolation_tasks ON public.tasks FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_agent_logs ON public.agent_logs;
CREATE POLICY org_isolation_agent_logs ON public.agent_logs FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_companies ON public.companies;
CREATE POLICY org_isolation_companies ON public.companies FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_agents ON public.agents;
CREATE POLICY org_isolation_agents ON public.agents FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_content_items ON public.content_items;
CREATE POLICY org_isolation_content_items ON public.content_items FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS org_isolation_sequences ON public.sequences;
CREATE POLICY org_isolation_sequences ON public.sequences FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- 8. seed Tony's 6 companies under org #1
INSERT INTO public.companies (organization_id, name, slug, industry, is_seed)
SELECT o.id, c.name, c.slug, c.industry, true
FROM (VALUES
  ('DKR Consulting & Healthcare Solutions', 'dkr-consulting', 'healthcare'),
  ('TV Healthcare & Consulting', 'tv-healthcare', 'healthcare'),
  ('Twizted Vybz Realty and Management', 'tv-realty', 'realty'),
  ('Twizted Vybz Generations Capital', 'tv-generations', 'finance'),
  ('Guilt Free Temptations', 'guilt-free-temptations', 'cpg'),
  ('Twizted Vybz Streetwear', 'tv-streetwear', 'apparel')
) AS c(name, slug, industry)
CROSS JOIN (SELECT id FROM public.organizations WHERE slug = 'twizted-vybz') o
ON CONFLICT (slug) DO NOTHING;
