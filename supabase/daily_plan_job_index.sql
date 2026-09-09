-- ============================================================================
-- PFL Production Dashboard — Daily Plan: job_no index
-- ============================================================================
-- Run this once in Supabase → SQL Editor, after daily_plan_entries.sql.
-- Safe to re-run.
--
-- Nothing else needs to change in the database for this update: "Production
-- Quantity" is a UI-only rename of the existing challan_quantity column (per
-- the request — column names stay so existing data isn't affected), and
-- job-wise pending/completed status is computed in the app from Order
-- Quantity + the sum of every entry for a Job No — it is never stored, so
-- there's no new column or table for it. This index just makes those
-- per-job lookups/groupings fast as the table grows.
-- ============================================================================

create index if not exists daily_plan_entries_job_no_idx
  on public.daily_plan_entries (job_no);
