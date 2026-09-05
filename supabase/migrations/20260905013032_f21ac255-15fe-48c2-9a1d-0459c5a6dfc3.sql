-- Shared board state: anyone may read (campus displays run without a login),
-- but only the server (service role, after checking a device access code) may
-- change it.
drop policy if exists "kairos_state_insert" on public.kairos_state;
drop policy if exists "kairos_state_update" on public.kairos_state;
drop policy if exists "kairos_state_delete" on public.kairos_state;
drop policy if exists "kairos_state_read" on public.kairos_state;

create policy "kairos_state_public_read" on public.kairos_state
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.kairos_state from anon, authenticated;
grant select on public.kairos_state to anon, authenticated;
grant all on public.kairos_state to service_role;

-- Document files: the app only ever reaches them server-side through signed
-- URLs, so remove the public read/write policies on the private bucket.
drop policy if exists "documents_objects_read" on storage.objects;
drop policy if exists "documents_objects_insert" on storage.objects;
drop policy if exists "documents_objects_update" on storage.objects;
drop policy if exists "documents_objects_delete" on storage.objects;