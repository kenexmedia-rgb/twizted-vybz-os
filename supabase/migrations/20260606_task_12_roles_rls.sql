-- Task 12: company-scoped roles, billable seats, invite acceptance, and RLS.

CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  is_billable_seat boolean NOT NULL DEFAULT false,
  invited_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_users_role_check
    CHECK (role IN ('org_owner', 'company_owner', 'company_member')),
  CONSTRAINT company_users_user_company_key UNIQUE (user_id, company_id)
);

ALTER TABLE public.agent_logs
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

CREATE INDEX IF NOT EXISTS company_users_user_id_idx
  ON public.company_users (user_id);
CREATE INDEX IF NOT EXISTS company_users_org_company_idx
  ON public.company_users (organization_id, company_id);
CREATE INDEX IF NOT EXISTS agent_logs_company_id_idx
  ON public.agent_logs (company_id);

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id
  FROM public.users
  WHERE user_id = auth.uid()
     OR (user_id IS NULL AND id = auth.uid())
  ORDER BY (user_id = auth.uid()) DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = public.current_app_user_id()
      AND organization_id = target_organization_id
      AND role = 'org_owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_company_access(
  target_organization_id uuid,
  target_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = public.current_app_user_id()
      AND organization_id = target_organization_id
      AND (
        role = 'org_owner'
        OR company_id = target_company_id
      )
  )
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_company_access(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_access(uuid, uuid) TO authenticated;

INSERT INTO public.company_users (
  organization_id,
  company_id,
  user_id,
  role,
  is_billable_seat
)
SELECT
  company.organization_id,
  company.id,
  tony.id,
  'org_owner',
  false
FROM public.companies AS company
JOIN public.organizations AS organization
  ON organization.id = company.organization_id
 AND organization.slug = 'twizted-vybz'
JOIN public.users AS tony
  ON tony.organization_id = organization.id
 AND lower(tony.email) = lower('tony@twiztedvybz.com')
ON CONFLICT (user_id, company_id) DO UPDATE
SET role = 'org_owner',
    is_billable_seat = false;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_company_id uuid;
  selected_organization_id uuid;
  legacy_role text;
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

  legacy_role := CASE
    WHEN new.raw_user_meta_data ->> 'company_role' = 'company_owner'
      THEN 'owner'
    WHEN new.raw_user_meta_data ->> 'role' IN ('owner', 'admin', 'member', 'viewer')
      THEN new.raw_user_meta_data ->> 'role'
    ELSE 'member'
  END;

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
    legacy_role
  )
  ON CONFLICT (id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      email = EXCLUDED.email,
      company_id = COALESCE(EXCLUDED.company_id, public.users.company_id),
      role = EXCLUDED.role;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.accept_company_invite()
RETURNS public.company_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invite_metadata jsonb;
  selected_company_id uuid;
  selected_organization_id uuid;
  selected_role text;
  inviter_id uuid;
  app_user_id uuid;
  membership public.company_users;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT raw_user_meta_data
    INTO invite_metadata
    FROM auth.users
   WHERE id = auth.uid();

  selected_company_id :=
    NULLIF(invite_metadata ->> 'company_id', '')::uuid;
  selected_organization_id :=
    NULLIF(invite_metadata ->> 'organization_id', '')::uuid;
  selected_role := invite_metadata ->> 'company_role';
  inviter_id := NULLIF(invite_metadata ->> 'invited_by', '')::uuid;
  app_user_id := public.current_app_user_id();

  IF app_user_id IS NULL
     OR selected_company_id IS NULL
     OR selected_organization_id IS NULL
     OR selected_role NOT IN ('company_owner', 'company_member') THEN
    RAISE EXCEPTION 'Invite scope is incomplete or invalid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = selected_company_id
      AND organization_id = selected_organization_id
  ) THEN
    RAISE EXCEPTION 'Invite company does not belong to the organization';
  END IF;

  IF inviter_id IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM public.company_users
       WHERE user_id = inviter_id
         AND organization_id = selected_organization_id
         AND role = 'org_owner'
     ) THEN
    RAISE EXCEPTION 'Invite was not created by an organization owner';
  END IF;

  INSERT INTO public.company_users (
    organization_id,
    company_id,
    user_id,
    role,
    is_billable_seat,
    invited_by
  )
  VALUES (
    selected_organization_id,
    selected_company_id,
    app_user_id,
    selected_role,
    true,
    inviter_id
  )
  ON CONFLICT (user_id, company_id) DO UPDATE
  SET role = EXCLUDED.role,
      is_billable_seat = true,
      invited_by = EXCLUDED.invited_by
  RETURNING * INTO membership;

  UPDATE public.users
  SET organization_id = selected_organization_id,
      company_id = selected_company_id,
      role = CASE
        WHEN selected_role = 'company_owner' THEN 'owner'
        ELSE 'member'
      END
  WHERE id = app_user_id;

  RETURN membership;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_company_invite() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_company_invite() TO authenticated;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.company_users,
  public.leads,
  public.approvals,
  public.tasks,
  public.agent_logs,
  public.conversations,
  public.companies
TO authenticated;

DROP POLICY IF EXISTS "Public read leads" ON public.leads;
DROP POLICY IF EXISTS "Public read approvals" ON public.approvals;
DROP POLICY IF EXISTS "Public read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Public read agent_logs" ON public.agent_logs;
DROP POLICY IF EXISTS "Public read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Public read companies" ON public.companies;

DROP POLICY IF EXISTS company_users_select_scope ON public.company_users;
CREATE POLICY company_users_select_scope
  ON public.company_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = public.current_app_user_id()
    OR public.is_org_owner(organization_id)
  );

DROP POLICY IF EXISTS company_users_org_owner_manage ON public.company_users;
CREATE POLICY company_users_org_owner_manage
  ON public.company_users
  FOR ALL
  TO authenticated
  USING (public.is_org_owner(organization_id))
  WITH CHECK (public.is_org_owner(organization_id));

DROP POLICY IF EXISTS org_isolation_leads ON public.leads;
DROP POLICY IF EXISTS task_12_company_scope ON public.leads;
CREATE POLICY task_12_company_scope
  ON public.leads FOR ALL TO authenticated
  USING (public.has_company_access(organization_id, company_id))
  WITH CHECK (public.has_company_access(organization_id, company_id));

DROP POLICY IF EXISTS org_isolation_approvals ON public.approvals;
DROP POLICY IF EXISTS task_12_company_scope ON public.approvals;
CREATE POLICY task_12_company_scope
  ON public.approvals FOR ALL TO authenticated
  USING (public.has_company_access(organization_id, company_id))
  WITH CHECK (public.has_company_access(organization_id, company_id));

DROP POLICY IF EXISTS org_isolation_tasks ON public.tasks;
DROP POLICY IF EXISTS task_12_company_scope ON public.tasks;
CREATE POLICY task_12_company_scope
  ON public.tasks FOR ALL TO authenticated
  USING (public.has_company_access(organization_id, company_id))
  WITH CHECK (public.has_company_access(organization_id, company_id));

DROP POLICY IF EXISTS org_isolation_agent_logs ON public.agent_logs;
DROP POLICY IF EXISTS task_12_company_scope ON public.agent_logs;
CREATE POLICY task_12_company_scope
  ON public.agent_logs FOR ALL TO authenticated
  USING (public.has_company_access(organization_id, company_id))
  WITH CHECK (public.has_company_access(organization_id, company_id));

DROP POLICY IF EXISTS org_isolation_conversations ON public.conversations;
DROP POLICY IF EXISTS task_12_company_scope ON public.conversations;
CREATE POLICY task_12_company_scope
  ON public.conversations FOR ALL TO authenticated
  USING (public.has_company_access(organization_id, company_id))
  WITH CHECK (public.has_company_access(organization_id, company_id));

DROP POLICY IF EXISTS org_isolation_companies ON public.companies;
DROP POLICY IF EXISTS task_12_company_scope ON public.companies;
CREATE POLICY task_12_company_scope
  ON public.companies FOR ALL TO authenticated
  USING (public.has_company_access(organization_id, id))
  WITH CHECK (public.has_company_access(organization_id, id));
