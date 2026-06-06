-- Cover the company foreign key independently of the scoped lookup index.
CREATE INDEX IF NOT EXISTS agent_config_company_id_idx
  ON public.agent_config (company_id);
