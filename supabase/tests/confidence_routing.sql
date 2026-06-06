-- Rollback-only integration coverage for confidence routing.
BEGIN;

DO $$
DECLARE
  test_org uuid := gen_random_uuid();
  test_user uuid := gen_random_uuid();
  routed jsonb;
  approval_record public.approvals;
  log_record public.agent_logs;
BEGIN
  INSERT INTO public.organizations (id, name, slug)
  VALUES (test_org, 'Confidence Routing Test', 'confidence-routing-test');

  INSERT INTO public.users (
    id, name, organization_id, autonomy_level
  )
  VALUES (
    test_user, 'Confidence Test User', test_org, 'ask_me_first'
  );

  INSERT INTO public.agent_config (
    organization_id, high_threshold, review_threshold
  )
  VALUES (test_org, 0.85, 0.60);

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Ask first high', 'email', 'customer@example.com',
    'Draft', NULL, 0.95, 'Strong match', 'inbound lead'
  );
  IF routed ->> 'route' <> 'approval' THEN
    RAISE EXCEPTION 'ask_me_first 0.95 must route to approval';
  END IF;

  UPDATE public.users
     SET autonomy_level = 'assist'
   WHERE id = test_user;

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Assist high', 'email', 'customer@example.com',
    'Draft', NULL, 0.95, 'Strong match', 'inbound lead'
  );
  SELECT * INTO log_record
  FROM public.agent_logs
  WHERE id = (routed ->> 'agent_log_id')::uuid;
  IF routed ->> 'route' <> 'auto_execute'
     OR log_record.autonomy_level_at_action <> 'assist' THEN
    RAISE EXCEPTION 'assist 0.95 must auto-execute and stamp assist';
  END IF;

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Assist review', 'email', 'customer@example.com',
    'Draft', NULL, 0.70, 'Some ambiguity', 'scheduled follow-up'
  );
  SELECT * INTO approval_record
  FROM public.approvals
  WHERE id = (routed ->> 'approval_id')::uuid;
  IF routed ->> 'route' <> 'approval'
     OR approval_record.status <> 'pending'
     OR approval_record.low_confidence
     OR approval_record.confidence_score <> 0.70
     OR approval_record.reasoning <> 'Some ambiguity'
     OR approval_record.source <> 'scheduled follow-up' THEN
    RAISE EXCEPTION 'assist 0.70 must create a normal pending approval';
  END IF;

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Assist low', 'email', 'customer@example.com',
    'Draft', NULL, 0.40, 'Missing context', 'inbound lead'
  );
  SELECT * INTO approval_record
  FROM public.approvals
  WHERE id = (routed ->> 'approval_id')::uuid;
  IF routed ->> 'route' <> 'approval'
     OR NOT approval_record.low_confidence THEN
    RAISE EXCEPTION 'assist 0.40 must create a low-confidence approval';
  END IF;

  UPDATE public.users
     SET autonomy_level = 'robotaxi'
   WHERE id = test_user;

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Robotaxi review', 'email', 'customer@example.com',
    'Draft', NULL, 0.70, 'Enough evidence', 'scheduled follow-up'
  );
  SELECT * INTO log_record
  FROM public.agent_logs
  WHERE id = (routed ->> 'agent_log_id')::uuid;
  IF routed ->> 'route' <> 'auto_execute'
     OR log_record.autonomy_level_at_action <> 'robotaxi' THEN
    RAISE EXCEPTION 'robotaxi 0.70 must auto-execute and stamp robotaxi';
  END IF;

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Robotaxi low', 'email', 'customer@example.com',
    'Draft', NULL, 0.40, 'Missing context', 'inbound lead'
  );
  SELECT * INTO approval_record
  FROM public.approvals
  WHERE id = (routed ->> 'approval_id')::uuid;
  IF routed ->> 'route' <> 'approval'
     OR NOT approval_record.low_confidence THEN
    RAISE EXCEPTION 'robotaxi 0.40 must pause for low-confidence approval';
  END IF;

  UPDATE public.agent_config
     SET review_threshold = 0.75
   WHERE organization_id = test_org
     AND company_id IS NULL
     AND agent_key IS NULL;

  routed := public.route_kai_action(
    test_user, NULL, 'kai', 'Changed threshold', 'email',
    'customer@example.com', 'Draft', NULL, 0.70, 'Same score',
    'scheduled follow-up'
  );
  IF routed ->> 'route' <> 'approval'
     OR (routed ->> 'review_threshold')::double precision <> 0.75
     OR (routed ->> 'low_confidence')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'routing must use the changed agent_config threshold';
  END IF;
END;
$$;

ROLLBACK;
