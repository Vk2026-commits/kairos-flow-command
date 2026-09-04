CREATE TABLE public.device_access_codes (
  code TEXT PRIMARY KEY,
  label TEXT,
  revoked BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.device_access_codes TO service_role;

ALTER TABLE public.device_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_access_codes_service_only"
  ON public.device_access_codes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_device_access_codes_updated
  BEFORE UPDATE ON public.device_access_codes
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

INSERT INTO public.device_access_codes (code, label)
VALUES ('KAIROS-2026', 'Command Hub');

-- Lock traffic plans: no public/browser access; only the app server (service role).
DROP POLICY IF EXISTS "Anyone can view traffic plans" ON public.traffic_plans;
DROP POLICY IF EXISTS "Anyone can insert traffic plans" ON public.traffic_plans;
DROP POLICY IF EXISTS "Anyone can update traffic plans" ON public.traffic_plans;
DROP POLICY IF EXISTS "Anyone can delete traffic plans" ON public.traffic_plans;

REVOKE ALL ON public.traffic_plans FROM anon;
REVOKE ALL ON public.traffic_plans FROM authenticated;
GRANT ALL ON public.traffic_plans TO service_role;

CREATE POLICY "traffic_plans_service_only"
  ON public.traffic_plans FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);