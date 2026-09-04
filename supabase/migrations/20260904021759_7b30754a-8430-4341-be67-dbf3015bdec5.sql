DROP POLICY IF EXISTS documents_read ON public.documents;
DROP POLICY IF EXISTS documents_insert ON public.documents;
DROP POLICY IF EXISTS documents_update ON public.documents;
DROP POLICY IF EXISTS documents_delete ON public.documents;

REVOKE ALL ON public.documents FROM anon;
REVOKE ALL ON public.documents FROM authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_service_only ON public.documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);