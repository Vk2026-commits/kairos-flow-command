-- 1. realtime for shared board state (phone counts -> dashboards)
ALTER TABLE public.kairos_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kairos_state;

-- 2. staff profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tp_touch_updated_at();

-- 3. roles
CREATE TYPE public.app_role AS ENUM ('admin', 'contributor', 'viewer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 4. auto-create profile + first account becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_admin boolean;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO first_admin;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_admin THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_staff
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();

-- 5. ownership on consulting records
ALTER TABLE public.consulting_activities ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_briefings ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_notes ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_site_visits ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_milestones ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_action_items ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_recommendations ADD COLUMN owner_id uuid;
ALTER TABLE public.consulting_before_after ADD COLUMN owner_id uuid;
CREATE INDEX idx_consulting_activities_owner ON public.consulting_activities(owner_id);
CREATE INDEX idx_consulting_briefings_owner ON public.consulting_briefings(owner_id);
CREATE INDEX idx_consulting_notes_owner ON public.consulting_notes(owner_id);