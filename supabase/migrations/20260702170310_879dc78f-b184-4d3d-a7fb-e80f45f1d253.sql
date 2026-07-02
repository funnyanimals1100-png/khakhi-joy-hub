
-- Add apply_link and notification_link to news for OJAS application links
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS apply_link text;

-- Storage policies for study-materials bucket (private bucket, signed URLs for read)
CREATE POLICY "study_materials_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'study-materials');

CREATE POLICY "study_materials_read_anon"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'study-materials');

CREATE POLICY "study_materials_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'study-materials' AND public.is_admin(auth.uid()));

CREATE POLICY "study_materials_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'study-materials' AND public.is_admin(auth.uid()));

CREATE POLICY "study_materials_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'study-materials' AND public.is_admin(auth.uid()));
