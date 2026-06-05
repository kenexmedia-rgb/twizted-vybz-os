-- Support idempotent transcript synchronization through PostgREST upsert.

CREATE UNIQUE INDEX IF NOT EXISTS conversations_onboarding_upsert_idx
  ON public.conversations (session_id, user_id, onboarding_sequence);
