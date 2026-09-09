-- Run once in Supabase SQL Editor.
-- Manager (PFL) can VIEW all Daily Plan entries, but cannot add/edit/delete.
-- This does not change any production data.

DROP POLICY IF EXISTS "daily_plan_entries: manager select all" ON public.daily_plan_entries;
CREATE POLICY "daily_plan_entries: manager select all"
ON public.daily_plan_entries
FOR SELECT
USING (
  public.current_role() = 'manager'
  AND public.is_active_user()
);
