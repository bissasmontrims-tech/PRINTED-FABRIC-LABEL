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

## Notes

- The dashboard's existing calculations, filters, tables, charts, and layout
  are unchanged — this update adds persistence, auth, roles, the corrected
  date handling, and the $28,000 daily target on top of the original design.
- `RAW_DATA` (the originally embedded sample) is now only a local-demo
  fallback used when Supabase env vars aren't configured — it is never used
  once Supabase is connected.
