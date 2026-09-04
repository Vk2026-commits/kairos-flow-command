CREATE TABLE public.kairos_state (
  key TEXT NOT NULL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kairos_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kairos_state TO authenticated;
GRANT ALL ON public.kairos_state TO service_role;

ALTER TABLE public.kairos_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kairos_state_read" ON public.kairos_state FOR SELECT USING (true);
CREATE POLICY "kairos_state_insert" ON public.kairos_state FOR INSERT WITH CHECK (true);
CREATE POLICY "kairos_state_update" ON public.kairos_state FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "kairos_state_delete" ON public.kairos_state FOR DELETE USING (true);