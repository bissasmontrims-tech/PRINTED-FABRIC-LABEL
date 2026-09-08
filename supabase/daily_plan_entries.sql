-- ============================================================================
-- PFL Production Dashboard — Daily Plan v2 (job-level entries, per-supervisor login)
-- ============================================================================
-- Run this in Supabase → SQL Editor → New query, AFTER schema.sql (and,
-- if you ran it earlier, after the old daily_plan.sql) have already been
-- run once. Safe to re-run.
--
-- This REPLACES how the "Daily Plan" section works. It does NOT touch or
-- drop the old `daily_plans` table (the simple one-number-per-supervisor
-- version) — that table is just no longer used by the app after this
-- update, so your old data in it is untouched but dormant. Nothing else
-- in the project (production_data, profiles roles admin/manager/operator,
-- existing pages) is modified by this file beyond what's described below.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles: add a 'supervisor' role and a supervisor_name link.
--
-- Each of the 5 supervisor login accounts gets role='supervisor' and
-- supervisor_name set to which of the 5 people they are. RLS policies below
-- use this link (not anything the frontend sends) to decide what a
-- supervisor can see/write — a supervisor cannot spoof being someone else
-- by changing a form field, because the check happens against this table
-- using auth.uid(), not against whatever the browser submits.
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','manager','operator','supervisor'));

alter table public.profiles add column if not exists supervisor_name text;
alter table public.profiles drop constraint if exists profiles_supervisor_name_check;
alter table public.profiles add constraint profiles_supervisor_name_check
  check (supervisor_name is null or supervisor_name in ('Aslam','Murad','Biplob','Selim Reza','Shahjahan'));

-- Two different login accounts can never both claim to be the same supervisor.
create unique index if not exists profiles_supervisor_name_unique
  on public.profiles (supervisor_name) where supervisor_name is not null;

-- Helper used by RLS policies below (mirrors current_role()/is_active_user() in schema.sql).
create or replace function public.my_supervisor_name()
returns text
language sql stable security definer set search_path = public as $$
  select supervisor_name from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 2. daily_plan_entries — one row per job entry a supervisor submits.
--    (Multiple entries per supervisor per day are expected and normal —
--    e.g. several jobs worked in one day — so this is append-only, like
--    production_data; there is no unique/upsert key.)
-- ----------------------------------------------------------------------------
create table if not exists public.daily_plan_entries (
  id                bigint generated always as identity primary key,
  plan_date         date not null default current_date,
  user_id           uuid not null references auth.users(id),
  supervisor_name   text not null check (supervisor_name in ('Aslam','Murad','Biplob','Selim Reza','Shahjahan')),
  job_no            text,
  buyer_no          text,
  order_quantity    numeric not null default 0,
  challan_quantity  numeric not null default 0,
  production_usd    numeric not null default 0,
  operator_name     text,
  machine_name      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists daily_plan_entries_date_idx on public.daily_plan_entries (plan_date);
create index if not exists daily_plan_entries_user_idx on public.daily_plan_entries (user_id);
create index if not exists daily_plan_entries_supervisor_idx on public.daily_plan_entries (supervisor_name);

-- Reuses the same set_updated_at() function created by schema.sql.
drop trigger if exists daily_plan_entries_set_updated_at on public.daily_plan_entries;
create trigger daily_plan_entries_set_updated_at
  before update on public.daily_plan_entries
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Row Level Security — this is the part that actually enforces "a
--    supervisor can only ever see/change their own rows," at the database
--    level, regardless of what the frontend sends.
-- ----------------------------------------------------------------------------
alter table public.daily_plan_entries enable row level security;

-- Admin: unrestricted, matches the admin pattern used everywhere else.
drop policy if exists "daily_plan_entries: admin all" on public.daily_plan_entries;
create policy "daily_plan_entries: admin all" on public.daily_plan_entries
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Supervisor: SELECT only their own rows.
drop policy if exists "daily_plan_entries: supervisor select own" on public.daily_plan_entries;
create policy "daily_plan_entries: supervisor select own" on public.daily_plan_entries
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and user_id = auth.uid()
  );

-- Supervisor: INSERT only as themselves — user_id AND supervisor_name must
-- match their own profile, so they can't submit an entry under another
-- supervisor's name even by editing the request payload directly.
drop policy if exists "daily_plan_entries: supervisor insert own" on public.daily_plan_entries;
create policy "daily_plan_entries: supervisor insert own" on public.daily_plan_entries
  for insert with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and user_id = auth.uid()
    and supervisor_name = public.my_supervisor_name()
  );

-- Supervisor: UPDATE only their own rows, and still can't change ownership
-- (the WITH CHECK re-validates the same conditions on the new row values).
drop policy if exists "daily_plan_entries: supervisor update own" on public.daily_plan_entries;
create policy "daily_plan_entries: supervisor update own" on public.daily_plan_entries
  for update using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and user_id = auth.uid()
  )
  with check (
    user_id = auth.uid()
    and supervisor_name = public.my_supervisor_name()
  );

-- Supervisor: DELETE only their own rows.
drop policy if exists "daily_plan_entries: supervisor delete own" on public.daily_plan_entries;
create policy "daily_plan_entries: supervisor delete own" on public.daily_plan_entries
  for delete using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and user_id = auth.uid()
  );

-- No policy is created for admin/manager/operator roles beyond the 'admin
-- all' policy above — Managers and Operators have no access to this table
-- (matches the spec: only Admin sees everyone, only the owning Supervisor
-- sees their own). This is enforced by RLS's default-deny: a role with no
-- matching policy gets zero rows, not an error.

-- ============================================================================
-- End. Next: in Supabase → Authentication → Users, create one login per
-- supervisor, then in Table Editor → profiles, set that user's role to
-- 'supervisor' and supervisor_name to their name (or use the app's User
-- Management page, which now exposes both fields for admins).
-- ============================================================================
