# Cutting Operator Update

This version adds a separate **Cutting Operator Name** field to each Daily Plan job.

## Who can update
- Admin: any job
- Manager: any job
- Supervisor: only jobs belonging to that supervisor

## When it appears
The Cutting Operator Name update control appears when a job reaches:
- Cutting Running
- Cutting Complete
- Handover to QC

Production Operator and Cutting Operator are stored separately.

## Supabase
Run `supabase/cutting_operator_update.sql` once in Supabase SQL Editor. It only adds the new nullable field and the Manager update policy; existing data is preserved.
