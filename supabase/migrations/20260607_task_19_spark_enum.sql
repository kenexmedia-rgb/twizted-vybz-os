-- Task 19: add the Spark plan label without assigning it to any user.

ALTER TYPE public.budget_plan_tier
  ADD VALUE IF NOT EXISTS 'spark';
