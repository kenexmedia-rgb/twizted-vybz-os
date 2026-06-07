-- Shared package catalog and initial Real Estate Agent package.
-- Additive changes only.

CREATE TABLE public.agent_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  family text NOT NULL CHECK (family IN ('industry', 'role')),
  audience text NOT NULL CHECK (audience IN ('owner', 'employee')),
  description text,
  agents jsonb NOT NULL DEFAULT '[]'::jsonb,
  depth text NOT NULL DEFAULT 'light' CHECK (depth IN ('deep', 'light')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER touch_agent_packages_updated_at
  BEFORE UPDATE ON public.agent_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_organizational_truths_updated_at();

ALTER TABLE public.agent_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_packages_authenticated_read
  ON public.agent_packages
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON TABLE public.agent_packages
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.agent_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.agent_packages TO service_role;

INSERT INTO public.agent_packages (
  package_key,
  display_name,
  family,
  audience,
  description,
  agents,
  depth
)
VALUES (
  'real_estate_agent',
  'Real Estate Agent Package',
  'industry',
  'owner',
  'Built for real estate agents — captures every lead the moment it comes in, follows up until they answer, books showings, runs your CMAs, wins back past clients, manages your reviews, and keeps your listings and content moving across every channel.',
  '[
    "Operations Supervisor",
    "Inbound Lead Handler",
    "FAQ & Customer Support",
    "Bilingual Agent (Spanish)",
    "Client Intake Agent",
    "Speed to Lead",
    "Outbound Agent",
    "Lead Nurture",
    "Follow-Up Sequences",
    "Reactivation",
    "Appointment Scheduling Agent",
    "CMA Agent",
    "Review & Reputation",
    "Blog Post Agent",
    "Instagram Post Agent",
    "Listing Agent",
    "Morning Briefing",
    "Appointment Reminder"
  ]'::jsonb,
  'deep'
);
