-- PFL Production Dashboard — Admin permanent Job delete cleanup
-- Run after daily_plan_entries.sql and job_status.sql.
-- Admin DELETE on jobs must remove the Job's workflow history and Daily Plan
-- entries as well, so a deleted Job can never reappear in Job Status/history.

create or replace function public.cleanup_deleted_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.job_status_history where job_no = old.job_no;
  delete from public.daily_plan_entries where job_no = old.job_no;
  return old;
end;
$$;

drop trigger if exists jobs_cleanup_after_delete on public.jobs;
create trigger jobs_cleanup_after_delete
after delete on public.jobs
for each row execute procedure public.cleanup_deleted_job();

-- Keep Admin as the only role allowed to delete Jobs.
-- Manager and Supervisor receive no DELETE policy on jobs.
-- The existing "jobs: admin all" policy in job_status.sql grants Admin DELETE.
