
-- Helper updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ USERS (profile mirror of auth.users) ============
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  exam_type TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Security-definer admin check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = uid), false)
      OR COALESCE((SELECT lower(email) FROM auth.users WHERE id = uid) = 'tonistark370140@gmail.com', false);
$$;

-- Auto-create profile + auto-admin for configured email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    lower(NEW.email) = 'tonistark370140@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ NEWS ============
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_en TEXT,
  summary TEXT,
  content TEXT,
  category TEXT DEFAULT 'general',
  exam_type TEXT,
  is_important BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT true,
  published_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_read_all" ON public.news FOR SELECT USING (true);
CREATE POLICY "news_admin_write" ON public.news FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ STUDY MATERIALS ============
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  exam_type TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_read_all" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "materials_admin_write" ON public.study_materials FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.study_materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MOCK TESTS ============
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  exam_type TEXT,
  duration_minutes INTEGER,
  total_questions INTEGER,
  difficulty TEXT,
  subjects TEXT[],
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_tests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_read_all" ON public.mock_tests FOR SELECT USING (true);
CREATE POLICY "tests_admin_write" ON public.mock_tests FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_tests_updated BEFORE UPDATE ON public.mock_tests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ QUESTIONS ============
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  subject TEXT,
  marks INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read_all" ON public.questions FOR SELECT USING (true);
CREATE POLICY "questions_admin_write" ON public.questions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ TEST RESULTS ============
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  time_taken_seconds INTEGER,
  answers JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_results TO authenticated;
GRANT ALL ON public.test_results TO service_role;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "results_select_own" ON public.test_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "results_insert_own" ON public.test_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "results_admin_read" ON public.test_results FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============ SEED DATA ============
INSERT INTO public.news (title, title_en, summary, content, category, exam_type, is_important, published_date) VALUES
('ગુજરાત પોલીસ LRD ભરતી 2026 જાહેરાત', 'Gujarat Police LRD Recruitment 2026 Announced', 'LRD ભરતી માટે 10,000+ જગ્યાઓ જાહેર', 'Gujarat Police has announced the LRD (Lokrakshak) recruitment 2026 with over 10,000 vacancies. Applications open soon on ojas.gujarat.gov.in.', 'recruitment', 'LRD', true, now() - interval '1 day'),
('PSI ભરતી પરીક્ષા તારીખ જાહેર', 'PSI Exam Date Announced', 'PSI પ્રિલિમ પરીક્ષા આગામી મહિને', 'The Police Sub Inspector preliminary exam will be conducted next month across all districts of Gujarat.', 'exam', 'PSI', true, now() - interval '2 days'),
('કોન્સ્ટેબલ ફિઝિકલ ટેસ્ટ ગાઇડલાઇન્સ', 'Constable Physical Test Guidelines', 'દોડ, ઊંચાઈ અને છાતીના માપદંડ', 'Updated guidelines for Constable physical efficiency test: 5 km run, height & chest measurement standards.', 'guideline', 'Constable', false, now() - interval '3 days'),
('GK કરન્ટ અફેર્સ: જૂન 2026', 'Current Affairs: June 2026', 'મહત્વના રાષ્ટ્રીય અને આંતરરાષ્ટ્રીય સમાચાર', 'Key current affairs for June 2026 useful for Gujarat Police exams - national and international highlights.', 'current-affairs', NULL, false, now() - interval '5 hours'),
('ગુજરાતી વ્યાકરણ ટિપ્સ', 'Gujarati Grammar Tips', 'સંધિ, સમાસ અને છંદ માટે મહત્વના નિયમો', 'Quick revision notes on Gujarati grammar - Sandhi, Samas and Chhand rules frequently asked in exams.', 'study', 'LRD', false, now() - interval '1 day');

INSERT INTO public.study_materials (title, description, subject, exam_type, is_premium, order_index) VALUES
('Indian Constitution Handbook', 'Complete notes on Indian Constitution for police exams', 'Polity', 'LRD', false, 1),
('Gujarat Geography Quick Notes', 'Districts, rivers, mountains and climate of Gujarat', 'Geography', 'LRD', false, 2),
('Maths Shortcut Tricks', 'Quantitative aptitude shortcuts and formulas', 'Mathematics', 'PSI', false, 3),
('Reasoning Practice Set', '500+ reasoning questions with solutions', 'Reasoning', 'Constable', true, 4),
('English Grammar Essentials', 'Tenses, voice, narration with examples', 'English', 'PSI', false, 5),
('Gujarati Sahitya Notes', 'સાહિત્યકારો અને તેમની કૃતિઓ', 'Gujarati', 'LRD', false, 6),
('Indian History Capsule', 'Ancient, Medieval and Modern India summary', 'History', 'PSI', true, 7),
('Police Manual Highlights', 'Important sections of Gujarat Police Manual', 'Polity', 'PSI', true, 8);

WITH t AS (
  INSERT INTO public.mock_tests (name, description, exam_type, duration_minutes, total_questions, difficulty, subjects, is_premium, is_active) VALUES
  ('LRD Full Mock Test 1', 'Full-length mock for Lokrakshak written exam', 'LRD', 60, 100, 'medium', ARRAY['Reasoning','GK','Maths','Gujarati'], false, true),
  ('PSI Prelims Practice 1', 'Practice test based on PSI Prelims pattern', 'PSI', 90, 100, 'hard', ARRAY['Reasoning','English','GK','Polity'], false, true),
  ('Constable GK Quiz', 'Quick GK quiz for Constable aspirants', 'Constable', 20, 25, 'easy', ARRAY['GK','Current Affairs'], false, true),
  ('Gujarat Current Affairs Test', 'Last 3 months Gujarat-specific current affairs', 'LRD', 15, 20, 'medium', ARRAY['Current Affairs'], true, true)
  RETURNING id, name
)
INSERT INTO public.questions (mock_test_id, question, options, correct_answer, explanation, subject, order_index)
SELECT id, q.question, q.options::jsonb, q.correct_answer, q.explanation, q.subject, q.ord
FROM t, (VALUES
  ('LRD Full Mock Test 1', 'ગુજરાતનું પાટનગર કયું છે?', '["અમદાવાદ","ગાંધીનગર","સુરત","વડોદરા"]', 1, 'ગાંધીનગર ગુજરાતનું પાટનગર છે.', 'GK', 1),
  ('LRD Full Mock Test 1', 'Who is the current Chief Minister of Gujarat?', '["Vijay Rupani","Bhupendra Patel","Anandiben Patel","Narendra Modi"]', 1, 'Bhupendra Patel is the current CM of Gujarat.', 'GK', 2),
  ('LRD Full Mock Test 1', '15 + 27 = ?', '["40","41","42","43"]', 2, '15 + 27 = 42', 'Maths', 3),
  ('PSI Prelims Practice 1', 'Article 370 of the Indian Constitution dealt with which state?', '["Punjab","Jammu & Kashmir","Assam","Nagaland"]', 1, 'Article 370 granted special status to J&K.', 'Polity', 1),
  ('PSI Prelims Practice 1', 'Choose the correct synonym of "Brave":', '["Coward","Valiant","Weak","Timid"]', 1, 'Valiant means brave.', 'English', 2),
  ('Constable GK Quiz', 'સરદાર વલ્લભભાઈ પટેલની જન્મજયંતી કયા દિવસે ઉજવાય છે?', '["31 ઓક્ટોબર","2 ઓક્ટોબર","14 નવેમ્બર","26 જાન્યુઆરી"]', 0, '31 ઓક્ટોબરે રાષ્ટ્રીય એકતા દિવસ.', 'GK', 1),
  ('Constable GK Quiz', 'Statue of Unity is located in?', '["Kevadia","Ahmedabad","Surat","Rajkot"]', 0, 'Statue of Unity is at Kevadia, Gujarat.', 'GK', 2),
  ('Gujarat Current Affairs Test', 'Which city hosted the Vibrant Gujarat Summit 2024?', '["Surat","Gandhinagar","Vadodara","Rajkot"]', 1, 'Vibrant Gujarat is held in Gandhinagar.', 'Current Affairs', 1)
) AS q(test_name, question, options, correct_answer, explanation, subject, ord)
WHERE t.name = q.test_name;
