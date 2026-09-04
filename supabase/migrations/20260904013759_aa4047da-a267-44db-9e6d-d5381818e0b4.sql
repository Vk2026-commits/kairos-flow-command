CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  meta TEXT,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_read" ON public.documents FOR SELECT USING (true);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (true);

CREATE POLICY "documents_objects_read" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "documents_objects_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents_objects_update" ON storage.objects FOR UPDATE USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents_objects_delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents');