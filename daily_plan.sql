-- ============================================================================
-- PFL Production Dashboard — Daily Plan add-on
-- ============================================================================
-- Run this in Supabase → SQL Editor → New query, AFTER schema.sql has already
-- been run once. Safe to re-run (IF NOT EXISTS / OR REPLACE / DROP POLICY IF
-- EXISTS throughout). This does not modify production_data or profiles.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: one row per supervisor per date. Upserting the same
-- (plan_date, supervisor_name) updates that supervisor's plan for that day
-- instead of creating a second row — this is what makes "Save Daily Plan"
-- safe to click again after editing a number.
-- ----------------------------------------------------------------------------
create table if not exists public.daily_plans (
  id              bigint generated always as identity primary key,
  plan_date       date not null,
  supervisor_name text not null check (supervisor_name in ('Aslam','Murad','Biplob','Selim Reza','Shahjahan')),
  planned_usd     numeric not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  unique (plan_date, supervisor_name)
);

create index if not exists daily_plans_date_idx on public.daily_plans (plan_date);

-- Reuses the same set_updated_at() function created by schema.sql.
drop trigger if exists daily_plans_set_updated_at on public.daily_plans;
create trigger daily_plans_set_updated_at
  before update on public.daily_plans
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security — mirrors the production_data policy pattern exactly:
-- any active authenticated user can read; admin has full access; manager can
-- submit/edit plans but not delete; operator is read-only.
-- ----------------------------------------------------------------------------
alter table public.daily_plans enable row level security;

drop policy if exists "daily_plans: authenticated read" on public.daily_plans;
create policy "daily_plans: authenticated read" on public.daily_plans
  for select using (auth.role() = 'authenticated' and public.is_active_user());

drop policy if exists "daily_plans: admin write" on public.daily_plans;
create policy "daily_plans: admin write" on public.daily_plans
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists "daily_plans: manager insert" on public.daily_plans;
create policy "daily_plans: manager insert" on public.daily_plans
  for insert with check (public.current_role() = 'manager' and public.is_active_user());

drop policy if exists "daily_plans: manager update" on public.daily_plans;
create policy "daily_plans: manager update" on public.daily_plans
  for update using (public.current_role() = 'manager' and public.is_active_user())
  with check (public.current_role() = 'manager' and public.is_active_user());

-- Operator: read-only (covered by the "authenticated read" policy above —
-- no insert/update policy exists for operator, so writes are rejected).

-- ============================================================================
-- End. The app computes "Daily Plan Total" by summing planned_usd for the
-- selected date — no separate total is stored, so it's always consistent
-- with whatever rows exist.
-- ============================================================================
