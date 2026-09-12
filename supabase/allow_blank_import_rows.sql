-- PFL Production Dashboard: preserve every imported row.
-- Run this ONCE in Supabase SQL Editor. It does NOT delete or update
-- existing production data.
--
-- Import no longer rejects rows because Date or Operator is blank.
-- Those blank values are stored as NULL so every Excel/CSV row can be saved.
ALTER TABLE public.production_data
  ALTER COLUMN report_date DROP NOT NULL;

ALTER TABLE public.production_data
  ALTER COLUMN operator_name DROP NOT NULL;

-- Duplicate-looking rows are valid and must not be blocked.
DROP INDEX IF EXISTS public.production_data_unique_key;
