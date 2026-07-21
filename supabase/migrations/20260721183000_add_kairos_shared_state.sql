CREATE TABLE public.kairos_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kairos_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kairos_state TO authenticated;
GRANT ALL ON public.kairos_state TO service_role;

ALTER TABLE public.kairos_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared Kairos state"
  ON public.kairos_state FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert shared Kairos state"
  ON public.kairos_state FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update shared Kairos state"
  ON public.kairos_state FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete shared Kairos state"
  ON public.kairos_state FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.ks_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_kairos_state_updated
  BEFORE UPDATE ON public.kairos_state
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.kairos_state;
