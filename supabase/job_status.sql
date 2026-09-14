-- ============================================================================
-- PFL Production Dashboard — Job Status workflow
-- ============================================================================
-- Run this in Supabase → SQL Editor, after schema.sql and
-- daily_plan_entries.sql have already been run. Safe to re-run. Does not
-- touch production_data, profiles, or daily_plan_entries data.
--
-- NOTE ON FIELDS: the request's job-card/table examples mention "Customer"
-- and "MC Type", but neither appears in the authoritative field list for
-- the production entry (Part 26 of the spec) or the entry form fields
-- (Part 8). Neither daily_plan_entries nor this table adds them, to avoid
-- inventing columns beyond what was actually specified — see the delivery
-- notes for how to add them later if they're genuinely wanted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. jobs — one row per Job No (a job belongs to exactly one supervisor).
--    Created automatically the first time that Job No is submitted via a
--    Daily Plan entry (status starts at 'Planned'); order/production/pending
--    quantities are NOT duplicated here — they stay computed from
--    daily_plan_entries, exactly as before. This table only tracks the
--    workflow status, which has no other source of truth.
-- ----------------------------------------------------------------------------
create table if not exists public.jobs (
  id                      bigint generated always as identity primary key,
  job_no                  text not null unique,
  user_id                 uuid not null references auth.users(id),
  supervisor_name         text not null check (supervisor_name in ('Aslam','Murad','Biplob','Selim Reza','Shahjahan')),
  current_status          text not null default 'Planned'
                            check (current_status in ('Planned','Production Running','Printing Complete','Cutting Running','Cutting Complete','Handover to QC')),
  status_updated_at       timestamptz not null default now(),
  status_updated_by       uuid references auth.users(id),
  status_updated_by_name  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists jobs_job_no_idx on public.jobs (job_no);
create index if not exists jobs_user_idx on public.jobs (user_id);
create index if not exists jobs_status_idx on public.jobs (current_status);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. job_status_history — append-only log. Never overwritten; "current
--    status" lives on `jobs` above, this is purely the audit trail.
-- ----------------------------------------------------------------------------
create table if not exists public.job_status_history (
  id               bigint generated always as identity primary key,
  job_no           text not null,
  status           text not null,
  updated_by       uuid references auth.users(id),
  updated_by_name  text,
  updated_at       timestamptz not null default now()
);

create index if not exists job_status_history_job_no_idx on public.job_status_history (job_no);
create index if not exists job_status_history_updated_at_idx on public.job_status_history (updated_at);

-- ----------------------------------------------------------------------------
-- 3. RLS — same pattern as daily_plan_entries: Admin full access, Manager
--    read-only, Supervisor scoped to auth.uid() with identity spoofing
--    blocked via my_supervisor_name() (defined in daily_plan_entries.sql).
-- ----------------------------------------------------------------------------
alter table public.jobs enable row level security;
alter table public.job_status_history enable row level security;

-- jobs: Admin
drop policy if exists "jobs: admin all" on public.jobs;
create policy "jobs: admin all" on public.jobs
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- jobs: Manager — view all Job records and status information (read-only).
drop policy if exists "jobs: manager select all" on public.jobs;
create policy "jobs: manager select all" on public.jobs
  for select using (public.current_role() = 'manager' and public.is_active_user());

-- jobs: Supervisor — only their own.
drop policy if exists "jobs: supervisor select own" on public.jobs;
create policy "jobs: supervisor select own" on public.jobs
  for select using (public.current_role() = 'supervisor' and public.is_active_user() and user_id = auth.uid());

drop policy if exists "jobs: supervisor insert own" on public.jobs;
create policy "jobs: supervisor insert own" on public.jobs
  for insert with check (
    public.current_role() = 'supervisor' and public.is_active_user()
    and user_id = auth.uid() and supervisor_name = public.my_supervisor_name()
  );

drop policy if exists "jobs: supervisor update own" on public.jobs;
create policy "jobs: supervisor update own" on public.jobs
  for update using (public.current_role() = 'supervisor' and public.is_active_user() and user_id = auth.uid())
  with check (user_id = auth.uid() and supervisor_name = public.my_supervisor_name());

-- job_status_history: Admin
drop policy if exists "job_status_history: admin all" on public.job_status_history;
create policy "job_status_history: admin all" on public.job_status_history
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- job_status_history: Manager — read all.
drop policy if exists "job_status_history: manager select all" on public.job_status_history;
create policy "job_status_history: manager select all" on public.job_status_history
  for select using (public.current_role() = 'manager' and public.is_active_user());

-- job_status_history: Supervisor — only history for jobs they own.
drop policy if exists "job_status_history: supervisor select own" on public.job_status_history;
create policy "job_status_history: supervisor select own" on public.job_status_history
  for select using (
    public.current_role() = 'supervisor' and public.is_active_user()
    and exists (select 1 from public.jobs j where j.job_no = job_status_history.job_no and j.user_id = auth.uid())
  );

drop policy if exists "job_status_history: supervisor insert own" on public.job_status_history;
create policy "job_status_history: supervisor insert own" on public.job_status_history
  for insert with check (
    public.current_role() = 'supervisor' and public.is_active_user()
    and updated_by = auth.uid()
    and exists (select 1 from public.jobs j where j.job_no = job_status_history.job_no and j.user_id = auth.uid())
  );

-- ============================================================================
-- End. See the README's "Job Status" section for the workflow this enables.
-- ============================================================================

-- ============================================================================
-- Supervisor cross-supervisor Job Status / Operator update access
-- ============================================================================
-- All active Supervisor accounts may view and update Job Status and the
-- stage-operator fields for any job. This intentionally does NOT grant them
-- Admin permissions or access to production/Daily Plan writes.
-- ============================================================================
drop policy if exists "jobs: supervisor select own" on public.jobs;
drop policy if exists "jobs: supervisor select all" on public.jobs;
create policy "jobs: supervisor select all" on public.jobs
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  );

drop policy if exists "jobs: supervisor update own" on public.jobs;
drop policy if exists "jobs: supervisor update all" on public.jobs;
create policy "jobs: supervisor update all" on public.jobs
  for update using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  )
  with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  );

drop policy if exists "job_status_history: supervisor select own" on public.job_status_history;
drop policy if exists "job_status_history: supervisor select all" on public.job_status_history;
create policy "job_status_history: supervisor select all" on public.job_status_history
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  );

drop policy if exists "job_status_history: supervisor insert own" on public.job_status_history;
drop policy if exists "job_status_history: supervisor insert all" on public.job_status_history;
create policy "job_status_history: supervisor insert all" on public.job_status_history
  for insert with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and updated_by = auth.uid()
  );
