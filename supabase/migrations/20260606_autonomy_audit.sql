-- Autonomy consent, configuration history, and action stamping.
-- Additive changes only.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS autonomy_level text NOT NULL DEFAULT 'ask_me_first';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_autonomy_level_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_autonomy_level_check
      CHECK (autonomy_level IN ('ask_me_first', 'assist', 'robotaxi'))
      NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.users
  VALIDATE CONSTRAINT users_autonomy_level_check;

ALTER TABLE public.agent_logs
  ADD COLUMN IF NOT EXISTS autonomy_level_at_action text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agent_logs_autonomy_level_at_action_check'
      AND conrelid = 'public.agent_logs'::regclass
  ) THEN
    ALTER TABLE public.agent_logs
      ADD CONSTRAINT agent_logs_autonomy_level_at_action_check
      CHECK (
        autonomy_level_at_action IS NULL
        OR autonomy_level_at_action IN ('ask_me_first', 'assist', 'robotaxi')
      )
      NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.agent_logs
  VALIDATE CONSTRAINT agent_logs_autonomy_level_at_action_check;

CREATE OR REPLACE FUNCTION public.stamp_autonomy_level_at_action()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.autonomy_level_at_action IS NOT NULL THEN
    SELECT autonomy_level
      INTO new.autonomy_level_at_action
      FROM public.users
     WHERE id = new.user_id;

    IF new.autonomy_level_at_action IS NULL THEN
      RAISE EXCEPTION
        'An autonomous action requires a user with a current autonomy level';
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS stamp_autonomy_level_at_action
  ON public.agent_logs;

CREATE TRIGGER stamp_autonomy_level_at_action
  BEFORE INSERT ON public.agent_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_autonomy_level_at_action();

CREATE INDEX IF NOT EXISTS agent_logs_autonomy_audit_idx
  ON public.agent_logs (user_id, event_type, created_at DESC)
  WHERE event_type IN ('autonomy_consent', 'autonomy_change');

CREATE OR REPLACE FUNCTION public.autonomy_level_rank(level text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT CASE level
    WHEN 'ask_me_first' THEN 0
    WHEN 'assist' THEN 1
    WHEN 'robotaxi' THEN 2
    ELSE -1
  END;
$$;

CREATE OR REPLACE FUNCTION public.log_autonomy_consent(
  target_user_id uuid,
  target_company_id uuid,
  target_autonomy_level text,
  target_confirmed_at timestamptz
)
RETURNS public.agent_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile public.users;
  audit_row public.agent_logs;
BEGIN
  IF target_autonomy_level NOT IN ('ask_me_first', 'assist', 'robotaxi') THEN
    RAISE EXCEPTION 'Invalid autonomy level: %', target_autonomy_level;
  END IF;

  IF target_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'confirmed_at is required';
  END IF;

  SELECT *
    INTO profile
    FROM public.users
   WHERE id = target_user_id;

  IF profile.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_company_id IS DISTINCT FROM profile.company_id THEN
    RAISE EXCEPTION 'Company scope does not match user profile';
  END IF;

  INSERT INTO public.agent_logs (
    user_id,
    organization_id,
    company_id,
    agent_name,
    action,
    result,
    event_type,
    endpoint_name,
    created_at
  )
  VALUES (
    profile.id,
    profile.organization_id,
    target_company_id,
    'kai',
    'autonomy_consent',
    jsonb_build_object(
      'autonomy_level', target_autonomy_level,
      'confirmed_at', target_confirmed_at
    )::text,
    'autonomy_consent',
    '/api/autonomy/consent',
    target_confirmed_at
  )
  RETURNING * INTO audit_row;

  RETURN audit_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_autonomy_level(
  target_user_id uuid,
  target_company_id uuid,
  target_old_level text,
  target_new_level text
)
RETURNS public.agent_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile public.users;
  audit_row public.agent_logs;
BEGIN
  IF target_old_level NOT IN ('ask_me_first', 'assist', 'robotaxi')
     OR target_new_level NOT IN ('ask_me_first', 'assist', 'robotaxi') THEN
    RAISE EXCEPTION 'Invalid autonomy level';
  END IF;

  SELECT *
    INTO profile
    FROM public.users
   WHERE id = target_user_id
   FOR UPDATE;

  IF profile.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_company_id IS DISTINCT FROM profile.company_id THEN
    RAISE EXCEPTION 'Company scope does not match user profile';
  END IF;

  IF profile.autonomy_level <> target_old_level THEN
    RAISE EXCEPTION 'Autonomy level changed: expected %, current %',
      target_old_level, profile.autonomy_level;
  END IF;

  IF public.autonomy_level_rank(target_new_level)
       > public.autonomy_level_rank(profile.autonomy_level)
     AND NOT EXISTS (
       SELECT 1
       FROM public.agent_logs
       WHERE user_id = profile.id
         AND company_id IS NOT DISTINCT FROM target_company_id
         AND event_type = 'autonomy_consent'
         AND public.autonomy_level_rank(
           result::jsonb ->> 'autonomy_level'
         ) >= public.autonomy_level_rank(target_new_level)
     ) THEN
    RAISE EXCEPTION
      'Prior autonomy consent at level % or higher is required',
      target_new_level;
  END IF;

  UPDATE public.users
     SET autonomy_level = target_new_level
   WHERE id = profile.id;

  INSERT INTO public.agent_logs (
    user_id,
    organization_id,
    company_id,
    agent_name,
    action,
    result,
    event_type,
    endpoint_name
  )
  VALUES (
    profile.id,
    profile.organization_id,
    target_company_id,
    'kai',
    'autonomy_change',
    jsonb_build_object(
      'old_level', target_old_level,
      'new_level', target_new_level
    )::text,
    'autonomy_change',
    '/api/autonomy/set'
  )
  RETURNING * INTO audit_row;

  RETURN audit_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_autonomy_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION
    'Autonomy audit rows are append-only and cannot be updated or deleted';
END;
$$;

DROP TRIGGER IF EXISTS block_autonomy_audit_mutation
  ON public.agent_logs;

CREATE TRIGGER block_autonomy_audit_mutation
  BEFORE UPDATE OR DELETE ON public.agent_logs
  FOR EACH ROW
  WHEN (
    old.event_type IN ('autonomy_consent', 'autonomy_change')
  )
  EXECUTE FUNCTION public.block_autonomy_audit_mutation();

REVOKE ALL ON FUNCTION public.autonomy_level_rank(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stamp_autonomy_level_at_action() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_autonomy_consent(uuid, uuid, text, timestamptz)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_autonomy_level(uuid, uuid, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_autonomy_consent(
  uuid, uuid, text, timestamptz
) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_autonomy_level(
  uuid, uuid, text, text
) TO service_role;
