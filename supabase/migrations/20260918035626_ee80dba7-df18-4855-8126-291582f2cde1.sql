CREATE TABLE public.consulting_police_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Report Needed',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consulting_police_reports_org_idx ON public.consulting_police_reports (organization_id, occurred_on DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consulting_police_reports TO authenticated;
GRANT ALL ON public.consulting_police_reports TO service_role;

ALTER TABLE public.consulting_police_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view police reports for their client"
  ON public.consulting_police_reports FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Service role manages police reports"
  ON public.consulting_police_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_consulting_police_reports_updated
  BEFORE UPDATE ON public.consulting_police_reports
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();