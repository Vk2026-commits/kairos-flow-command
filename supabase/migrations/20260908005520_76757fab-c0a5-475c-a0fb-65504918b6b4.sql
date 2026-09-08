DROP POLICY IF EXISTS "documents_service_only_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_service_only_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_service_only_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_service_only_delete" ON storage.objects;

CREATE POLICY "documents_service_only_select"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'documents');

CREATE POLICY "documents_service_only_insert"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_service_only_update"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_service_only_delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'documents');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'traffic_plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.traffic_plans;
  END IF;
END
$$;