-- Task 18 server-side access checks use the service role.

GRANT SELECT ON TABLE
  public.companies,
  public.company_users
TO service_role;
