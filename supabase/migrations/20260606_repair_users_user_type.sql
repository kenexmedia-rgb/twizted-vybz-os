-- Repair the partial user_type migration left with a NOT VALID constraint.
-- Existing role and user_type data is preserved.

ALTER TABLE public.users
  ALTER COLUMN user_type SET DEFAULT 'owner';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_user_type_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('owner', 'salespro')) NOT VALID;

ALTER TABLE public.users
  VALIDATE CONSTRAINT users_user_type_check;
