# PFL Production Dashboard

A Vite + React dashboard for Printed Fabric Label (PFL) factory production and
operator performance, backed by Supabase for authentication, roles, and
permanent data storage.

## Tech stack

- **React 18** + **Vite 5** — app shell and dev/build tooling
- **Tailwind CSS 3** — styling
- **Recharts** — charts
- **xlsx (SheetJS)** — CSV/Excel parsing on import
- **lucide-react** — icons
- **Supabase** — Postgres database, Auth, and Row Level Security (the actual source of truth for all production data)

## Project structure

```
pfl-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .gitignore
├── README.md
├── supabase/
│   └── schema.sql          ← run this in Supabase SQL Editor
├── src/
│   ├── main.jsx
│   ├── pfl-dashboard.jsx   ← main dashboard (unchanged UI/layout/calcs)
│   ├── index.css
│   ├── lib/
│   │   ├── dateUtils.js    ← the single date parser/formatter used everywhere
│   │   ├── supabaseClient.js
│   │   └── permissions.js
│   └── components/
│       ├── Login.jsx
│       ├── AuthGate.jsx
│       └── UserManagement.jsx
└── public/
```

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Go to **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and run it. This creates:
   - `production_data` — the production records table (source of truth)
   - `profiles` — one row per user, holding `role` (`admin` / `manager` / `operator`) and `is_active`
   - A unique index on `(report_date, job_number, machine_no, operator_name, shift)` for duplicate detection
   - Row Level Security policies enforcing the role permissions below
   - A trigger that auto-creates a `profiles` row (default role `operator`) whenever someone signs up
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the two values from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Add the same two variables in **Vercel → Project → Settings → Environment
Variables** before deploying. Never put the Supabase **Service Role Key**
anywhere in this project — it's not needed; the anon key + RLS policies
handle everything safely from the browser.

If these variables are not set, the app runs in a local demo mode using
sample data held only in memory (useful for UI development without a
database), and the Login screen shows a warning instead of a form.

## 3. Create the first Admin

There's no "create the first admin" button by design — the very first
account needs to be promoted manually, once, directly in the database:

1. In Supabase → **Authentication → Users**, click **Add user** (or have the
   person sign up normally, e.g. via a `supabase.auth.signUp` call or the
   Supabase dashboard's invite flow) using their real email and a password.
2. This automatically creates a matching row in `profiles` with `role = 'operator'`.
3. In Supabase → **Table Editor → profiles**, find that row and change `role` to `admin`.
4. Log in to the dashboard with that account — you'll now see **User Management** in the sidebar, and can change everyone else's role/status from there without touching SQL again.

New accounts after that are created the same way (Supabase → Authentication →
Users → Invite/Add user) — the frontend intentionally never handles account
creation directly, since that requires the Service Role Key, which must
never live in browser code.

## 4. Run locally

```bash
npm install
npm run dev
```

A one-time console message confirms the date-parser self-test passes on
startup in dev mode (see "Testing" below).

## 5. Build for production

```bash
npm run build
npm run preview   # sanity-check the build locally
```

## 6. Upload to GitHub

```bash
git init
git add .
git commit -m "Add Supabase persistence, auth, roles, and date-parsing fix"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 7. Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import the repository.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables (do this **before** the first deploy, or redeploy after adding them).
4. Confirm Build Command `npm run build`, Output Directory `dist` (Vercel auto-detects Vite).
5. Deploy.

## How data flows

```
Daily Excel/CSV report
  → parsed client-side (dates via src/lib/dateUtils.js — DD/MM/YYYY, ISO, and Excel serials all supported)
  → validated, shown as a Preview table
  → user clicks "Submit to Database"
  → upsert into Supabase production_data, using the unique key
    (report_date, job_number, machine_no, operator_name, shift)
    to reject duplicates instead of creating them
  → dashboard refetches from Supabase (the database is always the source of truth —
    refreshing the browser, logging in from another device, or logging out and back in
    all show the same data)
```

## Roles

| Action | Admin | Manager | Operator |
|---|---|---|---|
| View dashboard, filters, reports | ✅ | ✅ | ✅ |
| Import/submit daily reports | ✅ | ✅ | ❌ |
| Edit Settings (targets/thresholds) | ✅ | ✅ | 👁 read-only |
| Edit/delete production records | ✅ | ❌ | ❌ |
| Manage users (roles, enable/disable) | ✅ | ❌ | ❌ |

Enforced in two places: the UI hides actions a role can't perform, and — the
part that actually matters for security — Supabase Row Level Security
policies in `supabase/schema.sql` reject the request server-side even if
someone bypasses the UI.

## Testing

**Date parser** — run automatically in dev (`npm run dev`, check the browser
console) via `_runDateParserSelfTest()` in `src/lib/dateUtils.js`. Covers:
`03/09/2026→2026-09-03`, `04/09/2026→2026-09-04`, `05/09/2026→2026-09-05`,
`31/08/2026→2026-08-31`, plus ISO strings and Excel serials.

**Full data flow** — manual checklist:
1. Log in → dashboard loads data from Supabase.
2. Import Data → upload a report for `03/09/2026` → preview shows correct date → Submit.
3. Confirm the success message and that KPIs/charts update.
4. Refresh the browser → the `03/09/2026` data is still there.
5. Log out, log back in → still there.
6. Import `04/09/2026` → confirm `03/09/2026` data is untouched (Data Table page, or filter Date = 03/09/2026).
7. Filter Date = `03/09/2026` → only that date's rows appear.
8. Filter Month = September 2026 → both dates appear.
9. Re-upload the exact same `03/09/2026` file → import summary reports duplicates skipped, not new rows.

## Daily Plan (job-level entries, one login per supervisor)

Each supervisor — Aslam, Murad, Biplob, Selim Reza, Shahjahan — has their own
Supabase Auth login (`role = 'supervisor'` in `profiles`, linked to their
name via `profiles.supervisor_name`). Run, in order: `supabase/schema.sql`,
`supabase/daily_plan_entries.sql`, then `supabase/daily_plan_job_index.sql`.

**"Production Quantity" vs. the database column**: the UI always says
"Production Quantity" (renamed from "Challan Quantity"); the underlying
column is still named `challan_quantity` so existing data is untouched — this
is a label-only change everywhere in the app.

**Supervisor view**: a prominent **+ Add Entry** button opens the entry form
(Job No, Buyer No, Order Quantity, Production Quantity, Production USD,
Operator Name, Machine Name) — date, supervisor name, and `user_id` are never
taken from the browser, only from the logged-in session. All-time KPI totals
(Production USD / Order PCS / Production PCS / Pending PCS), a **My Pending
Jobs** table, and a date-filtered **My Entries** table follow.

**Job-wise pending, not just today's number**: Pending is never stored — it's
always computed as `Order Quantity − SUM(all Production Quantity entries for
that Job No)`, floored at 0. The same Job No can be entered again on a later
day if it isn't finished yet (this is normal, not a duplicate); once
cumulative production reaches the order quantity, the job is `Completed` and
drops out of the Pending Jobs list automatically. Trying to add production to
an already-completed job is blocked client-side with *"This Job is already
completed."* — Admin's own "+ Add Entry" isn't subject to that same block, so
Admin can still add to a job if genuinely needed.

**Admin view**: overall totals, a per-supervisor summary table (Production
USD / Order PCS / Production PCS / Pending PCS / Job count) for the selected
date, a clickable drill-down into that supervisor's entries, its own **+ Add
Entry** (with a supervisor picker, looked up against real linked accounts —
never the admin's own identity), and a global, all-dates **Pending Jobs**
table across every supervisor.

**Security**: enforced by Postgres RLS using `auth.uid()`, not just the UI —
a supervisor's `SELECT`/`INSERT`/`UPDATE`/`DELETE` are all scoped to
`user_id = auth.uid()`, and `INSERT`/`UPDATE` additionally require
`supervisor_name` to match that user's own linked name (via a
`my_supervisor_name()` helper), so no combination of frontend edits, URL
params, or direct API calls can read or write another supervisor's rows.
Admin has unrestricted access; Manager/Operator have none (no policy exists
for them on this table — RLS defaults to deny). See
`supabase/daily_plan_entries.sql` for the exact policies.

To create a supervisor account: Supabase → Authentication → Users → Add
user → Create new user. Then in the dashboard's **User Management** page (or
directly in the `profiles` table), set that account's role to `supervisor`
and link it to one of the 5 names.

The earlier one-number-per-day version of this feature (`daily_plans` /
`daily_plan.sql`) is no longer used by the app — it's left in place, unused,
rather than dropped, so no data is destroyed.

## Overview page scoping (Flexo / Nylo / Auto Screen)

**Total PCS**, **Total USD**, **Target USD** (and its Achievement %), the
**$28,000 Daily Target** card, **Management Alerts**, and **Best/Lowest
Operator** all count only Flexo, Nylo, and Auto Screen records — Cutting,
QC, Dropping, and any other MC Type are excluded from *these specific
widgets only*. Everything else (the full Operator Performance page, Machine/
MC Type/Shift/Buyer/Customer pages, the Data Table, CSV export) is
unaffected and still covers every MC type — including the "Production USD
by MC Type" chart on Overview itself, which deliberately still shows all
categories so you can see the full mix.

Best/Lowest Operator and the "Operators Below $400" table now show each
operator's biggest buyer alongside them (whichever buyer contributed the
most USD to that operator's core-scoped production) — e.g. "FARUK - $7,000
(PEPCO)". A new **"Operator Below 50,000 PCS Production"** section sits
directly below "Below $400" — this one deliberately covers *all* MC types,
not just the core three, and excludes anyone at exactly 50,000 PCS.

Operator Performance now has a search box above the operator dropdown —
case-insensitive, partial-match; narrowing to exactly one result opens that
operator's detail automatically.

Charts on the Machine/MC Type/Shift/Buyer/Customer pages, the MC Type chart
on Overview, Target vs Actual, and Wastage/Breakdown now show their values
directly on the bars (not just on hover). Buyer and Customer Analysis use a
full-width horizontal layout (names run left-to-right, unrotated) instead of
two rotated-label charts side by side, so long buyer/customer names stay
readable.

The Overview date filter now defaults to **Today** on load and after
Reset — it previously defaulted to "All Dates".

## This update: Manager view-only, Cutting Operator, crash-proofing

Run `supabase/manager_readonly_and_stage_operators.sql` once (after
`schema.sql`, `daily_plan_entries.sql`, and `job_status.sql`) — it drops the
two policies that let Manager write to `production_data` (an artifact of an
earlier, looser spec) and adds four nullable operator-name columns to
`jobs`.

- **Manager is now genuinely view-only everywhere** — enforced by RLS, not
  just hidden buttons. `import_data` (which also gates Add/Edit/Delete
  Daily Plan buttons) now checks `role === "admin"` only.
- **Supervisor's Total Production USD, Order PCS, and Production PCS are
  now strictly scoped to the selected date** — previously they summed all
  history, which was wrong. The date picker sits directly above those KPI
  cards. "My Pending Jobs" stays all-time, since job-wise pending is
  inherently cumulative across every day a job was worked — that's a
  different, deliberate scope, not an inconsistency.
- **Cutting Operator Name**: editable once a job reaches Cutting Running,
  Cutting Complete, or Handover to QC — by the owning Supervisor or Admin
  only. Every change is logged into the existing status-history log (no new
  table). Production/Printing/QC operator fields exist in the schema for
  the same pattern later, shown read-only for now.
- **A page can no longer go blank on error.** Every page is now wrapped in
  a React error boundary — if something throws during render, that page
  shows a "Retry" card instead of unmounting the whole app to white.
- `daily_plan_entries` now paginates past Supabase's 1000-row response cap,
  matching `production_data`'s existing pagination.
- Machine Performance now uses the same Top-10 + "View More" horizontal
  bar layout as Buyer/Customer Analysis, instead of squeezing every machine
  into rotated labels.

## Manager is now strict view-only; Cutting Operator tracking

Run `supabase/manager_readonly_and_stage_operators.sql` once (after
`schema.sql`, `daily_plan_entries.sql`, and `job_status.sql`). It does two
things:

1. **Drops Manager's write policies on `production_data`** — an earlier
   version of the schema had granted Manager `insert`/`update` there (for
   import support); Manager is now strictly `SELECT`-only everywhere,
   matching the final role rule (`import_data` in `permissions.js` is now
   admin-only too). Nothing on `daily_plan_entries`/`jobs`/
   `job_status_history` needed to change — those were already Manager-read-only.
2. **Adds four nullable columns to `jobs`**: `production_operator`,
   `printing_operator`, `cutting_operator`, `qc_operator`. Existing rows get
   `NULL` until someone records a name — no data is touched.

**Cutting Operator**: editable once a job reaches Cutting Running / Cutting
Complete / Handover to QC, by the owning Supervisor or Admin only (Manager
sees the value, never an edit control — enforced by RLS via the existing
`jobs` update policies, not just hidden in the UI). Changes are logged into
the existing `job_status_history` table as a readable line (e.g. *"Cutting
Operator Updated: Rahim → Karim"*) rather than a new table.

**Supervisor's Total Production USD** is now strictly scoped to whichever
date is selected (defaults to today, Asia/Dhaka) — it previously summed
all-time history, which was wrong. "My Pending Jobs" is deliberately still
all-time, since job-wise pending is inherently cumulative across days.

**Never a blank page**: the app previously had no error boundary anywhere,
so any single uncaught render error would unmount the whole page to white.
Every page is now wrapped in a `PageErrorBoundary` that catches render
errors and shows a "This page hit an unexpected error" card with Retry,
instead of a blank screen — and it resets automatically when you switch
sidebar pages.

## Job Status workflow

Run `supabase/job_status.sql` once (after `schema.sql` and
`daily_plan_entries.sql`) — it adds two new tables and touches nothing
existing: `jobs` (one row per Job No, created automatically the first time
that job is submitted via a Daily Plan entry, starting at status
`Planned`) and `job_status_history` (an append-only audit log — statuses are
never overwritten, only added to).

**Workflow stages, in order**: Planned → Production Running → Printing
Complete → Cutting Running → Cutting Complete → Handover to QC. A
Supervisor can only advance to the *next* stage — the UI only offers that
one option, and the app double-checks the current stage before writing.
Admin can correct a job to any stage. ("Completed" is a separate,
production-*quantity* concept — order ≤ produced — used only as an extra
filter value; it isn't part of this stage list.)

**Supervisor**: a "Job Status Update" section below their own Pending
Jobs — search by Job No (only their own jobs match, both by client-side
scoping and by RLS underneath), see a job card (Buyer, Machine, Order/
Production/Pending quantities, Production USD, current status, last
updated), and a single "Update Status → *next stage*" button.

**Admin/Manager**: a "Job Status" section — search by Job No (all jobs),
a status filter (all 6 stages + "Completed"), clickable count tiles that
double as the summary, and a full job table. Clicking a row opens full
details plus its complete status history. Only Admin sees the "correct
status" control (Manager is view-only here, matching the existing
Manager-is-read-only pattern for Daily Plan entries).

**Security**: identical pattern to `daily_plan_entries` — RLS policies use
`auth.uid()` for every operation, block a Supervisor from touching another
Supervisor's job or history row even if `user_id`/`job_no` in a request were
tampered with, and default-deny for any role without an explicit policy.

**A field-list note**: the request's job card/table examples mention
"Customer" and "MC Type", but neither appears in the authoritative field
list for the production entry, so neither was added to the database or
UI — adding them would mean inventing a schema decision not actually
specified. If you do want them, they're a small, additive change (one new
column + one new form field) — just confirm the exact field name and
whether it's free text or tied to the main production dataset's existing
Buyer/Customer/MC Type values.

## Notes
  are unchanged — this update adds persistence, auth, roles, the corrected
  date handling, and the $28,000 daily target on top of the original design.
- `RAW_DATA` (the originally embedded sample) is now only a local-demo
  fallback used when Supabase env vars aren't configured — it is never used
  once Supabase is connected.
