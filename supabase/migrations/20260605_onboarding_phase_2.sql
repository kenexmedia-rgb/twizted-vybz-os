-- Phase 2 onboarding storage. Additive changes only.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'owner';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_user_type_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_user_type_check
      CHECK (user_type IN ('owner', 'salespro')) NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS onboarding_sequence integer;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_onboarding_session_sequence_idx
  ON public.conversations (session_id, user_id, onboarding_sequence)
  WHERE onboarding_sequence IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.foundations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid REFERENCES public.companies(id),
  location text,
  contact_phone text,
  vibe text,
  differentiator text,
  recommended_agents text[] NOT NULL DEFAULT '{}',
  confidence double precision,
  raw_seed jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.salespro_foundations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  employer text,
  territory text[] NOT NULL DEFAULT '{}',
  lead_sources text[] NOT NULL DEFAULT '{}',
  differentiator text,
  employer_context jsonb NOT NULL DEFAULT '{}',
  raw_seed jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foundations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salespro_foundations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'foundations'
      AND policyname = 'foundations_org_isolation'
  ) THEN
    CREATE POLICY foundations_org_isolation ON public.foundations FOR ALL
      USING (
        organization_id = (
          SELECT organization_id
          FROM public.users
          WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'salespro_foundations'
      AND policyname = 'salespro_foundations_owner_isolation'
  ) THEN
    CREATE POLICY salespro_foundations_owner_isolation
      ON public.salespro_foundations FOR ALL
      USING (user_id = auth.uid());
  END IF;
END;
$$;
