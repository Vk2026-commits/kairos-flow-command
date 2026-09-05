-- VIP & Special Guests module. New tables only; nothing existing is altered
-- except widening the device role list so security and parking devices exist.

alter table public.device_access_codes drop constraint if exists device_access_codes_role_check;
alter table public.device_access_codes add constraint device_access_codes_role_check
  check (role = any (array['admin','executive','security','parking']));

create table public.vip_guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  guest_title text,
  organization text,
  phone text,
  email text,
  guest_type text not null default 'VIP',
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vip_visits (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.vip_guests(id) on delete cascade,
  visit_date date not null default current_date,
  event text,
  expected_arrival text,
  expected_departure text,
  host_name text,
  host_phone text,
  party_size integer not null default 1,
  special_instructions text,
  internal_notes text,
  arrival_method text not null default 'Self-Driving',
  status text not null default 'SCHEDULED',
  arrived_at timestamptz,
  arrived_by text,
  parked_at timestamptz,
  parked_by text,
  received_at timestamptz,
  received_by text,
  departing_at timestamptz,
  departing_by text,
  departed_at timestamptz,
  departed_by text,
  departure_notes text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vip_visits_date_idx on public.vip_visits (visit_date desc);

create table public.vip_vehicles (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.vip_visits(id) on delete cascade,
  make text,
  model text,
  color text,
  plate text,
  vehicle_type text,
  description text,
  driver_name text,
  driver_phone text,
  driver_company text,
  driver_vehicle text,
  driver_on_site boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index vip_vehicles_visit_idx on public.vip_vehicles (visit_id);

create table public.vip_parking_assignments (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.vip_visits(id) on delete cascade,
  lot text,
  space_zone text,
  reserved_area text,
  drop_off text,
  gate text,
  arrival_route text,
  exit_route text,
  linked_plan text,
  escort_required boolean not null default false,
  golf_cart_required boolean not null default false,
  ada_required boolean not null default false,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index vip_parking_visit_idx on public.vip_parking_assignments (visit_id);

create table public.vip_status_history (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.vip_visits(id) on delete cascade,
  status text not null,
  actor text,
  note text,
  created_at timestamptz not null default now()
);
create index vip_status_history_visit_idx on public.vip_status_history (visit_id, created_at desc);

create table public.vip_notes (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.vip_visits(id) on delete cascade,
  category text,
  note text not null default '',
  actor text,
  created_at timestamptz not null default now()
);
create index vip_notes_visit_idx on public.vip_notes (visit_id, created_at desc);

create table public.vip_activity_log (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.vip_visits(id) on delete cascade,
  guest_name text,
  action text not null,
  actor text,
  details text,
  created_at timestamptz not null default now()
);
create index vip_activity_log_visit_idx on public.vip_activity_log (visit_id, created_at desc);

grant all on public.vip_guests to service_role;
grant all on public.vip_visits to service_role;
grant all on public.vip_vehicles to service_role;
grant all on public.vip_parking_assignments to service_role;
grant all on public.vip_status_history to service_role;
grant all on public.vip_notes to service_role;
grant all on public.vip_activity_log to service_role;

alter table public.vip_guests enable row level security;
alter table public.vip_visits enable row level security;
alter table public.vip_vehicles enable row level security;
alter table public.vip_parking_assignments enable row level security;
alter table public.vip_status_history enable row level security;
alter table public.vip_notes enable row level security;
alter table public.vip_activity_log enable row level security;

create policy vip_guests_service_only on public.vip_guests for all to service_role using (true) with check (true);
create policy vip_visits_service_only on public.vip_visits for all to service_role using (true) with check (true);
create policy vip_vehicles_service_only on public.vip_vehicles for all to service_role using (true) with check (true);
create policy vip_parking_service_only on public.vip_parking_assignments for all to service_role using (true) with check (true);
create policy vip_status_history_service_only on public.vip_status_history for all to service_role using (true) with check (true);
create policy vip_notes_service_only on public.vip_notes for all to service_role using (true) with check (true);
create policy vip_activity_log_service_only on public.vip_activity_log for all to service_role using (true) with check (true);

create trigger trg_vip_guests_updated before update on public.vip_guests for each row execute function public.tp_touch_updated_at();
create trigger trg_vip_visits_updated before update on public.vip_visits for each row execute function public.tp_touch_updated_at();
create trigger trg_vip_vehicles_updated before update on public.vip_vehicles for each row execute function public.tp_touch_updated_at();
create trigger trg_vip_parking_updated before update on public.vip_parking_assignments for each row execute function public.tp_touch_updated_at();