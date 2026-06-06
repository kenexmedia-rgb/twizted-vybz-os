-- Sales Pro onboarding storage and idempotent per-user agent provisioning.
-- Additive changes only; the existing salespro_foundations table is preserved.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS employer_context jsonb;

ALTER TABLE public.users
  ALTER COLUMN user_type SET DEFAULT 'owner';

ALTER TABLE public.salespro_foundations
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS competitors text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS agents_user_type_key
  ON public.agents (user_id, type)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.provision_salespro_agents(
  target_user_id uuid
)
RETURNS SETOF public.agents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile public.users;
  foundation public.salespro_foundations;
  agent_type text;
  agent_types constant text[] := ARRAY[
    'speed_to_lead',
    'lead_nurture',
    'follow_up_sequences',
    'outbound_agent',
    'competitive_intelligence',
    'cma_agent'
  ];
BEGIN
  SELECT *
    INTO profile
    FROM public.users
   WHERE id = target_user_id
     AND user_type = 'salespro';

  IF profile.id IS NULL THEN
    RAISE EXCEPTION 'Sales Pro user not found';
  END IF;

  SELECT *
    INTO foundation
    FROM public.salespro_foundations
   WHERE user_id = target_user_id;

  IF foundation.id IS NULL THEN
    RAISE EXCEPTION 'Sales Pro foundation not found';
  END IF;

  UPDATE public.agents
     SET is_active = false
   WHERE user_id = target_user_id
     AND (type IS NULL OR NOT (type = ANY (agent_types)));

  FOREACH agent_type IN ARRAY agent_types LOOP
    INSERT INTO public.agents (
      organization_id,
      company_id,
      user_id,
      name,
      type,
      config,
      is_active,
      is_seed
    )
    VALUES (
      profile.organization_id,
      profile.company_id,
      profile.id,
      replace(initcap(replace(agent_type, '_', ' ')), 'Cma', 'CMA'),
      agent_type,
      jsonb_build_object(
        'contact_phone', foundation.contact_phone,
        'contact_email', COALESCE(foundation.contact_email, profile.email),
        'employer', foundation.employer,
        'territory', foundation.territory,
        'lead_sources', foundation.lead_sources,
        'competitors', foundation.competitors
      ),
      true,
      false
    )
    ON CONFLICT (user_id, type) WHERE user_id IS NOT NULL
    DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      company_id = EXCLUDED.company_id,
      name = EXCLUDED.name,
      config = EXCLUDED.config,
      is_active = true;
  END LOOP;

  RETURN QUERY
  SELECT *
    FROM public.agents
   WHERE user_id = target_user_id
     AND type = ANY (agent_types)
     AND is_active = true
   ORDER BY type;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_salespro_agents(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_salespro_agents(uuid) TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.agents TO service_role;
