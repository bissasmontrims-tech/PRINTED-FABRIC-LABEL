-- PFL Production Dashboard — Cutting Operator Update
-- Safe migration: adds one nullable field; existing data is preserved.
alter table public.jobs add column if not exists cutting_operator_name text;

-- Manager is VIEW-ONLY. No manager INSERT/UPDATE/DELETE policy is created.
-- Admin can update via the existing admin-all policy.
-- Supervisor can update only their own job via job_status.sql policy.
