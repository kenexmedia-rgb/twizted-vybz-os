-- Ensure only the intended package catalog privileges survive database defaults.

REVOKE ALL ON TABLE public.agent_packages
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.agent_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.agent_packages TO service_role;
