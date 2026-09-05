ALTER TABLE public.device_access_codes
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';

ALTER TABLE public.device_access_codes
  DROP CONSTRAINT IF EXISTS device_access_codes_role_check;
ALTER TABLE public.device_access_codes
  ADD CONSTRAINT device_access_codes_role_check CHECK (role IN ('admin', 'executive'));

CREATE TABLE public.consulting_project (
  id text NOT NULL PRIMARY KEY DEFAULT 'default',
  status text NOT NULL DEFAULT 'Assessment',
  phase text NOT NULL DEFAULT 'Existing Conditions Assessment',
  progress_pct integer NOT NULL DEFAULT 0,
  next_action text,
  summary text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_project TO service_role;
ALTER TABLE public.consulting_project ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_project_service_only" ON public.consulting_project FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_project_updated BEFORE UPDATE ON public.consulting_project FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();
INSERT INTO public.consulting_project (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE public.consulting_activities (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Completed',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_activities TO service_role;
ALTER TABLE public.consulting_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_activities_service_only" ON public.consulting_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_activities_updated BEFORE UPDATE ON public.consulting_activities FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE TABLE public.consulting_site_visits (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Completed',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_site_visits TO service_role;
ALTER TABLE public.consulting_site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_site_visits_service_only" ON public.consulting_site_visits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_site_visits_updated BEFORE UPDATE ON public.consulting_site_visits FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE TABLE public.consulting_milestones (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Not Started',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_milestones TO service_role;
ALTER TABLE public.consulting_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_milestones_service_only" ON public.consulting_milestones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_milestones_updated BEFORE UPDATE ON public.consulting_milestones FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE TABLE public.consulting_action_items (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Not Started',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_action_items TO service_role;
ALTER TABLE public.consulting_action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_action_items_service_only" ON public.consulting_action_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_action_items_updated BEFORE UPDATE ON public.consulting_action_items FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE TABLE public.consulting_recommendations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Identified',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_recommendations TO service_role;
ALTER TABLE public.consulting_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_recommendations_service_only" ON public.consulting_recommendations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_recommendations_updated BEFORE UPDATE ON public.consulting_recommendations FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE TABLE public.consulting_notes (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Admin Only',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_notes TO service_role;
ALTER TABLE public.consulting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_notes_service_only" ON public.consulting_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_notes_updated BEFORE UPDATE ON public.consulting_notes FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

CREATE TABLE public.consulting_before_after (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'In Progress',
  occurred_on date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_before_after TO service_role;
ALTER TABLE public.consulting_before_after ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulting_before_after_service_only" ON public.consulting_before_after FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_consulting_before_after_updated BEFORE UPDATE ON public.consulting_before_after FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();