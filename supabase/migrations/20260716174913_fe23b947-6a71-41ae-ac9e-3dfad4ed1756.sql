
CREATE TABLE public.traffic_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  saved_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  base TEXT NOT NULL,
  layers JSONB NOT NULL DEFAULT '{}'::jsonb,
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  live_view JSONB,
  live_map_type TEXT,
  street_view BOOLEAN,
  service TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.traffic_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.traffic_plans TO authenticated;
GRANT ALL ON public.traffic_plans TO service_role;

ALTER TABLE public.traffic_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view traffic plans"
  ON public.traffic_plans FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert traffic plans"
  ON public.traffic_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update traffic plans"
  ON public.traffic_plans FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete traffic plans"
  ON public.traffic_plans FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.tp_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_traffic_plans_updated
  BEFORE UPDATE ON public.traffic_plans
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_plans;
