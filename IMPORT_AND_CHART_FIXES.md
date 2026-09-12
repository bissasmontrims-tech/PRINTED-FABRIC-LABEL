# PFL Production Dashboard — Import & Chart Fixes

## Import
- Import is append-only; duplicate filtering is disabled.
- Every parsed Excel/CSV row is kept in the preview and submitted.
- Blank Date/Operator values are preserved as NULL instead of being rejected.
- Run `supabase/allow_blank_import_rows.sql` once in Supabase SQL Editor.

## Charts
- Daily Target vs Actual labels are centered inside bars and rotated vertically.
- Vertical bar-chart labels on Machine / MC Type / Shift / Wastage / Overview are centered inside bars.
- Daily PCS Trend labels remain horizontal at points.
- Daily chart date labels remain horizontal and automatically skip labels when the series is crowded.
- Daily charts no longer force a horizontal scrollbar for normal daily ranges.
