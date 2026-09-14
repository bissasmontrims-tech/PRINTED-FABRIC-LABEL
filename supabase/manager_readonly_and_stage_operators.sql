-- ============================================================================
-- PFL Production Dashboard — Manager → strict view-only, Stage Operators
-- ============================================================================
-- Run this in Supabase → SQL Editor, after schema.sql, daily_plan_entries.sql,
-- and job_status.sql have already been run. Safe to re-run. Does not delete
-- or modify any existing row — only policies and new (nullable) columns.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Manager loses write access to production_data.
--    Manager already only has SELECT on daily_plan_entries/jobs/
--    job_status_history (see daily_plan_entries.sql / job_status.sql) — no
--    change needed there. This was the one table where an earlier version
--    of the schema had granted Manager insert/update; removing it now.
-- ----------------------------------------------------------------------------
drop policy if exists "production_data: manager insert" on public.production_data;
drop policy if exists "production_data: manager update" on public.production_data;
-- The existing "production_data: authenticated read" policy already covers
-- Manager's view access — nothing further needed for read.

-- ----------------------------------------------------------------------------
-- 2. Stage-specific operator names on `jobs`. Nullable, additive — existing
--    rows simply have NULL until someone records a name for that stage.
--    Nothing about daily_plan_entries.operator_name changes; that column
--    keeps meaning "who logged this production entry", same as always.
-- ----------------------------------------------------------------------------
alter table public.jobs add column if not exists production_operator text;
alter table public.jobs add column if not exists printing_operator  text;
alter table public.jobs add column if not exists cutting_operator   text;
alter table public.jobs add column if not exists qc_operator        text;

-- No new RLS policies needed: these are just more columns on the same `jobs`
-- row, already covered by the existing policies in job_status.sql —
-- Admin: full access. Manager: SELECT only (can see the values, cannot
-- write them — enforced at the database level, not just a hidden button).
-- Supervisor: SELECT/UPDATE only their own job (user_id = auth.uid()), so a
-- Supervisor can only ever set an operator name on a job they own.

-- ============================================================================
-- End.
-- ============================================================================
