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

## Manager Presentation Chart Polish (latest)
- Daily/Monthly/Yearly PCS trend labels use clean horizontal value pills.
- Daily/Monthly/Yearly Target vs Actual labels use custom centered vertical SVG labels so the `$` symbol and digits do not collide.
- Chart currency labels use a compact readable format such as `$28,800` while KPI/table values retain full cents.
- Daily X-axis labels use `DD-Mon` format (for example `08-Sep`) and remain horizontal to prevent overlap.
- The same vertical label treatment is applied to Machine, MC Type, Shift, Wastage and Breakdown bar charts.
