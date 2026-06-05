-- Supabase Auth integration for public.users.
-- Apply through the Supabase migration system only.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_company_id uuid;
  selected_organization_id uuid;
BEGIN
  selected_company_id :=
    NULLIF(new.raw_user_meta_data ->> 'company_id', '')::uuid;
  selected_organization_id :=
    NULLIF(new.raw_user_meta_data ->> 'organization_id', '')::uuid;

  IF selected_company_id IS NOT NULL THEN
    SELECT organization_id
      INTO selected_organization_id
      FROM public.companies
     WHERE id = selected_company_id;

    IF selected_organization_id IS NULL THEN
      RAISE EXCEPTION 'Invite company does not exist';
    END IF;
  END IF;

  IF selected_organization_id IS NULL THEN
    SELECT id
      INTO selected_organization_id
      FROM public.organizations
     ORDER BY created_at
     LIMIT 1;
  END IF;

  IF selected_organization_id IS NULL THEN
    RAISE EXCEPTION 'No organization exists for new user';
  END IF;

  INSERT INTO public.users (
    id,
    user_id,
    name,
    email,
    created_at,
    organization_id,
    company_id,
    role
  )
  VALUES (
    new.id,
    new.id,
    COALESCE(
      NULLIF(new.raw_user_meta_data ->> 'name', ''),
      split_part(COALESCE(new.email, 'user'), '@', 1)
    ),
    new.email,
    COALESCE(new.created_at, now()),
    selected_organization_id,
    selected_company_id,
    COALESCE(NULLIF(new.raw_user_meta_data ->> 'role', ''), 'member')
  )
  ON CONFLICT (id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      email = EXCLUDED.email,
      company_id = COALESCE(EXCLUDED.company_id, public.users.company_id),
      role = EXCLUDED.role;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

UPDATE public.users AS app_user
SET user_id = auth_user.id
FROM auth.users AS auth_user
WHERE app_user.id = auth_user.id
  AND app_user.user_id IS NULL;
