-- ============================================================================
-- PFL Production Dashboard — Supabase schema, roles, and Row Level Security
-- ============================================================================
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles table — one row per authenticated user, holds role + status
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'operator' check (role in ('admin','manager','operator')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- The very first user created should be promoted to 'admin' manually (see README).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'operator')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. production_data table — the factory report data, source of truth
-- ----------------------------------------------------------------------------
create table if not exists public.production_data (
  id               bigint generated always as identity primary key,
  report_date      date not null,               -- calendar date only, NOT timestamptz
  mc_type          text,
  shift            text,
  job_number       text,
  unit_price       numeric,
  production_pcs   numeric not null default 0,
  production_usd   numeric not null default 0,
  price_per_dz     numeric,
  buyer_name       text,
  customer_name    text,
  operator_name    text not null,
  machine_no       text,
  target_usd       numeric,
  dhu_percent      numeric,
  wastage          numeric default 0,
  machine_breakdown numeric default 0,
  remarks          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id)
);

-- Production reports are row-level imports: duplicate-looking rows are valid
-- and must be preserved. Do NOT create a unique index across report fields.
-- If an older deployment created this index, remove it:
drop index if exists public.production_data_unique_key;

-- Useful indexes for the dashboard's filters
create index if not exists production_data_date_idx on public.production_data (report_date);
create index if not exists production_data_operator_idx on public.production_data (operator_name);
create index if not exists production_data_month_idx on public.production_data (date_trunc('month', report_date));

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists production_data_set_updated_at on public.production_data;
create trigger production_data_set_updated_at
  before update on public.production_data
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.production_data enable row level security;

-- Helper: current user's role, without recursive RLS lookups.
create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

-- ---- profiles policies ----
drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: admin read all" on public.profiles
  for select using (public.current_role() = 'admin');

drop policy if exists "profiles: admin update all" on public.profiles;
create policy "profiles: admin update all" on public.profiles
  for update using (public.current_role() = 'admin');

drop policy if exists "profiles: self update basic fields" on public.profiles;
create policy "profiles: self update basic fields" on public.profiles
  for update using (auth.uid() = id);

-- ---- production_data policies ----
-- All active, authenticated roles (admin/manager/operator) may read.
drop policy if exists "production_data: authenticated read" on public.production_data;
create policy "production_data: authenticated read" on public.production_data
  for select using (auth.role() = 'authenticated' and public.is_active_user());

-- Admin: full write access.
drop policy if exists "production_data: admin write" on public.production_data;
create policy "production_data: admin write" on public.production_data
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Manager: may insert/update (import reports), may NOT delete.
drop policy if exists "production_data: manager insert" on public.production_data;
create policy "production_data: manager insert" on public.production_data
  for insert with check (public.current_role() = 'manager' and public.is_active_user());

drop policy if exists "production_data: manager update" on public.production_data;
create policy "production_data: manager update" on public.production_data
  for update using (public.current_role() = 'manager' and public.is_active_user())
  with check (public.current_role() = 'manager' and public.is_active_user());

-- Operator: read-only (already covered by the "authenticated read" policy above,
-- no insert/update/delete policy is created for operator = no write access).

-- ============================================================================
-- End of schema. Next step: create your first Admin — see README.md
-- "How to create the first Admin".
-- ============================================================================
