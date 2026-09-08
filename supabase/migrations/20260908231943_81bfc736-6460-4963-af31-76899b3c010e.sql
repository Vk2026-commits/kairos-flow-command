CREATE TABLE public.consulting_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'Published'::text,
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.consulting_briefings TO service_role;

ALTER TABLE public.consulting_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY consulting_briefings_service_only ON public.consulting_briefings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_consulting_briefings_updated
  BEFORE UPDATE ON public.consulting_briefings
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE INDEX idx_consulting_briefings_date ON public.consulting_briefings (occurred_on DESC);