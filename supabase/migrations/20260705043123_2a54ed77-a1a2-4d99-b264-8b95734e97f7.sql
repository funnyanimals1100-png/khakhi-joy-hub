
-- Study materials: allow browse for anon + authenticated. RLS policy still hides premium rows from non-premium users.
GRANT SELECT ON public.study_materials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;

DROP POLICY IF EXISTS "study_materials auth read" ON public.study_materials;
CREATE POLICY "study_materials public browse"
  ON public.study_materials FOR SELECT
  TO anon, authenticated
  USING ((NOT COALESCE(is_premium, false)) OR private.is_premium(auth.uid()) OR private.is_admin(auth.uid()));

-- Mock tests: same shape
GRANT SELECT ON public.mock_tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;

DROP POLICY IF EXISTS "mock_tests auth read" ON public.mock_tests;
CREATE POLICY "mock_tests public browse"
  ON public.mock_tests FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND ((NOT COALESCE(is_premium, false)) OR private.is_premium(auth.uid()) OR private.is_admin(auth.uid())));
