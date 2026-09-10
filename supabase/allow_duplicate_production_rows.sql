-- Run this ONCE in Supabase SQL Editor if the old unique index still exists.
-- This does not delete or update any existing production data.
DROP INDEX IF EXISTS public.production_data_unique_key;
