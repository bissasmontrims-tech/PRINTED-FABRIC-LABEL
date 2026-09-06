# PFL Production import fix

This version:
- preserves Excel calendar dates using raw XLSX values;
- does not remove duplicate-looking rows within the Excel batch;
- uses `insert()` instead of `upsert(... ignoreDuplicates)`;
- drops the old `production_data_unique_key` index from the schema.

IMPORTANT: Existing Supabase databases need the one-time SQL:
`drop index if exists public.production_data_unique_key;`

After deploying this code, verify the Preview date before submitting.
