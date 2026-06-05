-- Server-side onboarding access for the Supabase service role.

GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.foundations TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.salespro_foundations TO service_role;
