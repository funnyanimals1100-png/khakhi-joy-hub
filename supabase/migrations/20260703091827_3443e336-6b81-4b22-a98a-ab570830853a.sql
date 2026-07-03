
-- 1) Premium flag on user profile
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- 2) Move public.is_admin to a private schema (preserves policy references by OID)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

ALTER FUNCTION public.is_admin(uuid) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.is_premium(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT u.is_premium OR u.is_admin FROM public.users u WHERE u.id = uid), false)
      OR private.is_admin(uid);
$$;
REVOKE ALL ON FUNCTION private.is_premium(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_premium(uuid) TO postgres, service_role;

-- 3) Reset SELECT policies on sensitive tables (preserve admin_write policies)
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname='public' AND tablename IN ('questions','mock_tests','study_materials')
             AND policyname NOT ILIKE '%admin%'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "mock_tests auth read" ON public.mock_tests FOR SELECT TO authenticated
  USING (is_active = true AND (NOT is_premium OR private.is_premium(auth.uid())));
REVOKE SELECT ON public.mock_tests FROM anon;

CREATE POLICY "study_materials auth read" ON public.study_materials FOR SELECT TO authenticated
  USING (NOT is_premium OR private.is_premium(auth.uid()));
REVOKE SELECT ON public.study_materials FROM anon;

-- questions: no non-admin SELECT policy at all => answer keys unreachable via Data API
REVOKE SELECT ON public.questions FROM anon;

-- 4) Safe view for taking tests (no correct_answer / explanation)
DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public
WITH (security_invoker = on) AS
SELECT q.id, q.mock_test_id, q.question, q.options, q.subject, q.marks, q.order_index
FROM public.questions q
WHERE EXISTS (
  SELECT 1 FROM public.mock_tests t
  WHERE t.id = q.mock_test_id
    AND t.is_active = true
    AND (NOT t.is_premium OR private.is_premium(auth.uid()))
);
GRANT SELECT ON public.questions_public TO authenticated;

-- 5) Server-side scoring RPC — inserts attempt, then returns answer key
CREATE OR REPLACE FUNCTION public.submit_test(
  p_mock_test_id uuid,
  p_answers jsonb,
  p_time_taken_seconds int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total int := 0;
  v_score int := 0;
  v_qs jsonb;
  v_result_id uuid;
  v_can boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT (t.is_active AND (NOT t.is_premium OR private.is_premium(v_user)))
    INTO v_can FROM public.mock_tests t WHERE t.id = p_mock_test_id;
  IF NOT COALESCE(v_can, false) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', q.id, 'question', q.question, 'options', q.options,
    'correct_answer', q.correct_answer, 'explanation', q.explanation,
    'subject', q.subject, 'order_index', q.order_index
  ) ORDER BY q.order_index), '[]'::jsonb)
  INTO v_qs FROM public.questions q WHERE q.mock_test_id = p_mock_test_id;

  v_total := jsonb_array_length(v_qs);

  SELECT COUNT(*)::int INTO v_score
  FROM public.questions q
  WHERE q.mock_test_id = p_mock_test_id
    AND (p_answers ->> q.id::text) IS NOT NULL
    AND (p_answers ->> q.id::text)::int = q.correct_answer;

  INSERT INTO public.test_results(user_id, mock_test_id, score, total_questions, time_taken_seconds, answers)
  VALUES (v_user, p_mock_test_id, v_score, v_total, p_time_taken_seconds, p_answers)
  RETURNING id INTO v_result_id;

  RETURN jsonb_build_object('result_id', v_result_id, 'score', v_score, 'total', v_total, 'questions', v_qs);
END $$;
REVOKE ALL ON FUNCTION public.submit_test(uuid, jsonb, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_test(uuid, jsonb, int) TO authenticated;

-- 6) Storage: ensure only admins can write to study-materials bucket (read stays authenticated)
-- (Existing admin_insert/update/delete policies already reference private.is_admin via ALTER above.)
