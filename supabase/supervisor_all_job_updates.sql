-- PFL Production Dashboard
-- ALL SUPERVISORS: Job Status + Stage Operator update access
-- Run after job_status.sql and manager_readonly_and_stage_operators.sql.
-- This does NOT grant Managers write access and does not change Daily Plan
-- write permissions.

alter table public.jobs enable row level security;
alter table public.job_status_history enable row level security;

-- Replace old Supervisor-own-job policies with all-Supervisor policies.
drop policy if exists "jobs: supervisor select own" on public.jobs;
drop policy if exists "jobs: supervisor update own" on public.jobs;
drop policy if exists "jobs: supervisor select all" on public.jobs;
drop policy if exists "jobs: supervisor update all" on public.jobs;

create policy "jobs: supervisor select all" on public.jobs
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  );

create policy "jobs: supervisor update all" on public.jobs
  for update using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  )
  with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  );

-- All Supervisors can see status history and add their own audit entry.
drop policy if exists "job_status_history: supervisor select own" on public.job_status_history;
drop policy if exists "job_status_history: supervisor insert own" on public.job_status_history;
drop policy if exists "job_status_history: supervisor select all" on public.job_status_history;
drop policy if exists "job_status_history: supervisor insert all" on public.job_status_history;

create policy "job_status_history: supervisor select all" on public.job_status_history
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
  );

create policy "job_status_history: supervisor insert all" on public.job_status_history
  for insert with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and updated_by = auth.uid()
  );

-- Managers remain SELECT-only through the manager policies.
