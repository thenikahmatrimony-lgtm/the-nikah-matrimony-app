-- THE NIKAH MATRIMONY shared admin app
-- Run once in Supabase Dashboard > SQL Editor.
create table if not exists public.tnm_profiles (
  profile_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.tnm_profiles enable row level security;
drop policy if exists "Authenticated admins can read TNM profiles" on public.tnm_profiles;
create policy "Authenticated admins can read TNM profiles"
  on public.tnm_profiles for select to authenticated using (true);
drop policy if exists "Authenticated admins can insert TNM profiles" on public.tnm_profiles;
create policy "Authenticated admins can insert TNM profiles"
  on public.tnm_profiles for insert to authenticated with check (true);
drop policy if exists "Authenticated admins can update TNM profiles" on public.tnm_profiles;
create policy "Authenticated admins can update TNM profiles"
  on public.tnm_profiles for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated admins can delete TNM profiles" on public.tnm_profiles;
create policy "Authenticated admins can delete TNM profiles"
  on public.tnm_profiles for delete to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do update set public = false;
drop policy if exists "Authenticated admins manage TNM photos" on storage.objects;
create policy "Authenticated admins manage TNM photos"
  on storage.objects for all to authenticated
  using (bucket_id = 'profile-photos')
  with check (bucket_id = 'profile-photos');

-- Enable Realtime notifications for profile changes.
do $$
begin
  alter publication supabase_realtime add table public.tnm_profiles;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
