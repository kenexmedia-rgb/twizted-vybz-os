-- Task 18: enforce org/company agent type idempotency.
-- Separate partial indexes make NULL company scopes unique as well.

CREATE UNIQUE INDEX IF NOT EXISTS agents_org_company_type_key
  ON public.agents (organization_id, company_id, type)
  WHERE company_id IS NOT NULL AND type IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS agents_org_type_key
  ON public.agents (organization_id, type)
  WHERE company_id IS NULL AND type IS NOT NULL;
