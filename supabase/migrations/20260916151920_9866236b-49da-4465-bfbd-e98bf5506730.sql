-- ============ 1. Organizations ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  client_type text NOT NULL DEFAULT 'Church / Ministry',
  primary_contact text,
  contact_title text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  website text,
  project_name text,
  contract_start date,
  contract_end date,
  account_status text NOT NULL DEFAULT 'Setup',
  internal_notes text,
  logo_path text,
  modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

-- ============ 2. Membership ============
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  member_role text NOT NULL DEFAULT 'client_viewer',
  status text NOT NULL DEFAULT 'active',
  invitation_status text NOT NULL DEFAULT 'none',
  invited_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organization_members_org_user_idx
  ON public.organization_members (organization_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX organization_members_org_email_idx
  ON public.organization_members (organization_id, lower(email)) WHERE email IS NOT NULL;
GRANT SELECT ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_organization_members_updated BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

-- ============ 3. Helper functions ============
CREATE OR REPLACE FUNCTION public.is_kairos_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.organization_members
                 WHERE user_id = _user_id AND member_role = 'kairos_super_admin' AND status = 'active')
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_kairos_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.organization_members
                 WHERE user_id = _user_id AND organization_id = _org_id AND status = 'active')
$$;

CREATE POLICY organizations_select_member ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), id));
CREATE POLICY organizations_service ON public.organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY organization_members_select_own_org ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY organization_members_service ON public.organization_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ 4. Audit trail ============
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id uuid,
  actor text,
  action text NOT NULL,
  record_type text,
  record_id text,
  record_label text,
  previous_status text,
  new_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_org_created_idx ON public.audit_log (organization_id, created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_select_member ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY audit_log_service ON public.audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ 5. Seed the two clients ============
INSERT INTO public.organizations (id, name, slug, client_type, project_name, account_status, modules)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Wheeler Avenue Baptist Church', 'wheeler-avenue-baptist-church',
   'Church / Ministry', 'Traffic & Parking Optimization', 'Active',
   '{"consulting":true,"parking":true,"traffic":true,"lots":true,"maps":true,"ingressEgress":true,"vip":true,"assessments":true,"siteVisits":true,"actionItems":true,"recommendations":true,"reporting":true}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'The Lighthouse Church and Ministries', 'the-lighthouse-church-and-ministries',
   'Church / Ministry', NULL, 'Setup',
   '{"consulting":true,"parking":true,"traffic":true,"lots":true,"maps":true,"ingressEgress":true,"vip":true,"assessments":true,"siteVisits":true,"actionItems":true,"recommendations":true,"reporting":true}'::jsonb);

-- ============ 6. Active client on profiles ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
UPDATE public.profiles SET active_org_id = '11111111-1111-4111-8111-111111111111' WHERE active_org_id IS NULL;

-- Every existing staff account becomes a Kairos member of Wheeler, mirroring their staff level.
INSERT INTO public.organization_members (organization_id, user_id, email, full_name, member_role, status, invitation_status)
SELECT '11111111-1111-4111-8111-111111111111', p.id, p.email, p.full_name,
       CASE WHEN public.is_kairos_super_admin(p.id) THEN 'kairos_super_admin' ELSE 'kairos_consultant' END,
       'active', 'accepted'
FROM public.profiles p
ON CONFLICT DO NOTHING;

-- Kairos staff also get membership in the new client so the switcher works.
INSERT INTO public.organization_members (organization_id, user_id, email, full_name, member_role, status, invitation_status)
SELECT '22222222-2222-4222-8222-222222222222', p.id, p.email, p.full_name, 'kairos_super_admin', 'active', 'accepted'
FROM public.profiles p
WHERE public.is_kairos_super_admin(p.id)
ON CONFLICT DO NOTHING;

-- ============ 7. Stamp every operational table with a client ============
DO $$
DECLARE
  t text;
  wheeler uuid := '11111111-1111-4111-8111-111111111111';
  tables text[] := ARRAY[
    'consulting_action_items','consulting_activities','consulting_before_after','consulting_briefings',
    'consulting_checklist','consulting_decisions','consulting_milestones','consulting_notes',
    'consulting_parking_counts','consulting_project','consulting_recommendations','consulting_site_visits',
    'documents','kairos_state','traffic_plans','vip_guests','vip_visits','vip_activity_log','vip_notes',
    'vip_parking_assignments','vip_status_history','vip_vehicles','device_access_codes'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET organization_id = %L WHERE organization_id IS NULL', t, wheeler);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET DEFAULT %L', t, wheeler);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (organization_id)', t || '_org_idx', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id))', t || '_select_member', t);
  END LOOP;
END $$;

-- ============ 8. Per-client keys where the old key was global ============
ALTER TABLE public.kairos_state DROP CONSTRAINT IF EXISTS kairos_state_pkey;
ALTER TABLE public.kairos_state ADD CONSTRAINT kairos_state_pkey PRIMARY KEY (organization_id, key);

ALTER TABLE public.consulting_project DROP CONSTRAINT IF EXISTS consulting_project_pkey;
ALTER TABLE public.consulting_project ADD CONSTRAINT consulting_project_pkey PRIMARY KEY (organization_id, id);
