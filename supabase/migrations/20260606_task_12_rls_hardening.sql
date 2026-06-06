-- Remove legacy permissive policies that would bypass Task 12 isolation.

DROP POLICY IF EXISTS "Public read leads" ON public.leads;
DROP POLICY IF EXISTS "Public read approvals" ON public.approvals;
DROP POLICY IF EXISTS "Public read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Public read agent_logs" ON public.agent_logs;
DROP POLICY IF EXISTS "Public read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Public read companies" ON public.companies;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.company_users,
  public.leads,
  public.approvals,
  public.tasks,
  public.agent_logs,
  public.conversations,
  public.companies
TO authenticated;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_company_access(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_access(uuid, uuid) TO authenticated;
