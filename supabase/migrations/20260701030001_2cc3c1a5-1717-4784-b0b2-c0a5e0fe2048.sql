
CREATE TABLE public.recruitment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organization text,
  description text,
  exam_type text,
  apply_link text,
  official_link text,
  last_date timestamptz,
  important_dates jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recruitment_notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruitment_notifications TO authenticated;
GRANT ALL ON public.recruitment_notifications TO service_role;

ALTER TABLE public.recruitment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recruitment notifications"
  ON public.recruitment_notifications FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert recruitment notifications"
  ON public.recruitment_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update recruitment notifications"
  ON public.recruitment_notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete recruitment notifications"
  ON public.recruitment_notifications FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER recruitment_notifications_updated_at
  BEFORE UPDATE ON public.recruitment_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few examples
INSERT INTO public.recruitment_notifications (title, organization, description, exam_type, apply_link, official_link, last_date, important_dates)
VALUES
  ('Gujarat Police LRD Recruitment 2026', 'Gujarat Police', 'Recruitment for Lokrakshak Dal (LRD) posts across Gujarat.', 'LRD', 'https://ojas.gujarat.gov.in', 'https://police.gujarat.gov.in', now() + interval '30 days',
   '[{"label":"Application Start","date":"2026-07-01"},{"label":"Last Date to Apply","date":"2026-07-31"},{"label":"Written Exam","date":"2026-09-15"}]'::jsonb),
  ('GPSC Class 1-2 Advertisement 2026', 'Gujarat Public Service Commission', 'Combined competitive examination for Class 1 and Class 2 officers.', 'PSI', 'https://gpsc-ojas.gujarat.gov.in', 'https://gpsc.gujarat.gov.in', now() + interval '45 days',
   '[{"label":"Notification Date","date":"2026-06-20"},{"label":"Last Date","date":"2026-08-15"},{"label":"Prelims","date":"2026-10-20"}]'::jsonb);
