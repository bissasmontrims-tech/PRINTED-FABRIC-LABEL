-- PFL Production Dashboard
-- SUPERVISOR: ONLY JOBS SUBMITTED BY THAT SUPERVISOR
--
-- This replaces the previous "all supervisors can see all jobs" policy.
-- A Supervisor can see/update a Job ONLY when that Supervisor has at least
-- one row for that job in daily_plan_entries (matched by auth.uid()).
-- Admin remains unrestricted; Manager remains read-only.

alter table public.jobs enable row level security;
alter table public.job_status_history enable row level security;

-- Helper: database-level ownership is based on the Daily Plan submission,
-- not on a browser-supplied supervisor_name or jobs.user_id value.
create or replace function public.supervisor_can_access_job(p_job_no text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.daily_plan_entries e
    join public.profiles p on p.id = auth.uid()
    where e.job_no = p_job_no
      and e.user_id = auth.uid()
      and p.role = 'supervisor'
      and p.is_active = true
  );
$$;

-- Remove the previous all-Supervisor policies.
drop policy if exists "jobs: supervisor select own" on public.jobs;
drop policy if exists "jobs: supervisor update own" on public.jobs;
drop policy if exists "jobs: supervisor select all" on public.jobs;
drop policy if exists "jobs: supervisor update all" on public.jobs;

-- Supervisor sees ONLY jobs they have submitted through Daily Plan.
create policy "jobs: supervisor select submitted" on public.jobs
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and public.supervisor_can_access_job(job_no)
  );

-- Supervisor can update ONLY those same submitted jobs.
create policy "jobs: supervisor update submitted" on public.jobs
  for update using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and public.supervisor_can_access_job(job_no)
  )
  with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and public.supervisor_can_access_job(job_no)
  );

-- Status history: Supervisor can see history ONLY for their submitted jobs.
drop policy if exists "job_status_history: supervisor select own" on public.job_status_history;
drop policy if exists "job_status_history: supervisor insert own" on public.job_status_history;
drop policy if exists "job_status_history: supervisor select all" on public.job_status_history;
drop policy if exists "job_status_history: supervisor insert all" on public.job_status_history;

create policy "job_status_history: supervisor select submitted" on public.job_status_history
  for select using (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and public.supervisor_can_access_job(job_no)
  );

create policy "job_status_history: supervisor insert submitted" on public.job_status_history
  for insert with check (
    public.current_role() = 'supervisor'
    and public.is_active_user()
    and updated_by = auth.uid()
    and public.supervisor_can_access_job(job_no)
  );

-- No Supervisor DELETE policy is added.
-- Manager remains SELECT-only through the existing Manager policies.
-- Admin retains full access through the existing Admin policies.

-- RESULT:
-- Supervisor A submits Job 123 in Daily Plan -> A can see/update Job 123.
-- Supervisor B has NOT submitted Job 123 -> B cannot see/search/update Job 123.
-- If Supervisor B submits Job 456 -> B can see/update Job 456.
-- Frontend filtering is also applied, but RLS is the real security boundary.
