GRANT SELECT ON public.study_materials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;

GRANT SELECT ON public.mock_tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;