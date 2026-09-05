# PFL Dashboard — Complete Setup, Deployment & Testing Guide

This guide assumes you have never used Supabase, GitHub, React, or Vercel
before. Follow it top to bottom in order — later steps depend on earlier
ones. Every command is exact; copy-paste them as written.

You'll need, before starting:
- The **PFL Dashboard ZIP** you downloaded
- A free [GitHub](https://github.com/signup) account
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (you can sign up with your GitHub account — one less password to make)
- [Node.js](https://nodejs.org) installed on your computer (download the "LTS" version, run the installer, click Next through it)

---

## PART 1 — Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Fill in:
   - **Name**: `pfl-dashboard` (or anything you like)
   - **Database Password**: click "Generate a password", then **copy it somewhere safe** (a notes app). You won't need to type this password anywhere in the app — it's only for direct database admin access if you ever need it.
   - **Region**: pick the one closest to your factory (e.g. Singapore for Bangladesh).
4. Click **Create new project**. Wait 1–2 minutes while Supabase sets it up (it shows a progress screen).

---

## PART 2 — Set up the database using schema.sql (Point 1)

1. Once your project is ready, look at the left sidebar. Click the icon that looks like `</>` labeled **SQL Editor**.
2. Click **New query** (top left of the editor).
3. Open **`schema.sql`** (the file you downloaded) in any text editor (Notepad, VS Code, TextEdit) and select all the text (Ctrl+A / Cmd+A), then copy it (Ctrl+C / Cmd+C).
4. Paste the entire contents into the Supabase SQL Editor box.
5. Click the green **Run** button (bottom right, or press Ctrl+Enter).
6. You should see "Success. No rows returned" at the bottom. This means it worked.
   - If you see a red error instead, copy the exact error text and send it to me — don't guess a fix.
7. Confirm the tables were created: in the left sidebar, click **Table Editor**. You should see two tables listed: `production_data` and `profiles`.

**What this did:** created your two database tables, the duplicate-detection rule, and the security rules (who can see/edit what) — all described in Part 6 below.

---

## PART 3 — Configure Supabase Authentication (Point 3)

1. In the left sidebar, click **Authentication**.
2. Click **Providers** (or **Sign In / Providers**, depending on your dashboard version).
3. Find **Email** in the list and make sure it's **enabled** (toggle on). This is usually on by default — you likely don't need to change anything here.
4. That's it for now — no other provider (Google, Facebook, etc.) is needed since the dashboard only uses email + password login.

---

## PART 4 — Get your API keys (Points 4 & 5 — where things go)

1. In the left sidebar, click the gear icon **Project Settings**.
2. Click **API** in the settings menu.
3. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefgh.supabase.co` → this is your `VITE_SUPABASE_URL`
   - **anon public** key (a long string starting with `eyJ...`, under "Project API keys") → this is your `VITE_SUPABASE_ANON_KEY`
4. Keep this browser tab open — you'll copy these two values in the next two parts.

⚠️ There is also a **service_role** key on that same page. **Never use it, never copy it into the project, never share it.** The app only ever needs the `anon` key.

---

## PART 5 — Create the Admin user (Point 2)

Do this now, before you deploy, so you have a login ready to test with.

1. In Supabase, left sidebar → **Authentication** → **Users**.
2. Click **Add user** (top right).
3. Choose **Create new user** (not "Send invitation" — this lets you set a password immediately, no email needed).
4. Enter:
   - **Email**: your real email, e.g. `admin@yourcompany.com`
   - **Password**: choose one and remember it (e.g. write it in the same notes app)
   - Make sure **Auto Confirm User** is checked/ticked (so you don't need to click a confirmation email).
5. Click **Create user**.
6. Now go to **Table Editor** → click the `profiles` table. You should see one row with your email, and `role` set to `operator` (this happened automatically).
7. Click into that row's `role` cell and change it from `operator` to `admin`. Press Enter / click away to save.
8. Confirm: the row now shows `role = admin` and `is_active = true`.

You now have one working Admin login: the email + password from step 4.

---

## PART 6 — Configure environment variables locally (Points 4 & 5)

1. Unzip the **PFL Dashboard ZIP** you downloaded, into any folder on your computer (e.g. Desktop).
2. Open that folder. You'll see a file called **`.env.example`**.
3. Make a copy of it in the same folder, and rename the copy to exactly: **`.env.local`**
   - On Windows: right-click → Copy, right-click → Paste, then rename the pasted file, making sure it doesn't become `.env.local.txt` (turn on "show file extensions" in File Explorer if needed).
   - On Mac: `⌘C`, `⌘V`, then rename. Files starting with a dot are hidden by default — press `⌘+Shift+.` in Finder to see them.
4. Open `.env.local` in a text editor. It looks like this:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Replace the two placeholder values with the **Project URL** and **anon public** key you copied in Part 4. Save the file.

This file is only for running the project on your own computer — it's never uploaded to GitHub (it's already excluded via `.gitignore`).

---

## PART 7 — Run the project on your computer (Point 6, connecting to Supabase)

1. Open a terminal:
   - **Windows**: search for "Command Prompt" or "PowerShell" in the Start menu.
   - **Mac**: search for "Terminal" using Spotlight (`⌘+Space`).
2. Navigate into the project folder. If you unzipped it to your Desktop:
   ```bash
   cd Desktop/pfl-dashboard
   ```
3. Install the project's dependencies (this downloads React, Supabase, etc. — only needs to be done once, or again if you change `package.json`):
   ```bash
   npm install
   ```
   This takes 1–3 minutes. You'll see a progress bar and then a summary. See **Part 15** below if this shows errors.
4. Start the local dev server:
   ```bash
   npm run dev
   ```
5. It will print something like `Local: http://localhost:5173/`. Open that URL in your browser.
6. You should see the **Login** page. Log in with the Admin email/password you created in Part 5.
7. If login succeeds and you see the dashboard sidebar (Overview, Daily/Monthly/Yearly, etc.) — **Supabase is connected correctly.**

If you instead see a warning that Supabase isn't configured, double-check `.env.local` — the file must be named exactly `.env.local` (not `.env` or `.env.local.txt`), sit in the project's root folder (same level as `package.json`), and you must restart `npm run dev` after creating/editing it (stop it with Ctrl+C, run `npm run dev` again — Vite only reads env files at startup).

---

## PART 8 — Test Excel/CSV import (Point 7)

1. While logged in, click **Import Data** in the sidebar.
2. Click the upload box, choose an Excel (`.xlsx`) or CSV file with your production data (columns: Date, MC Type, Shift, Job Number, Unit Price, Production PCS, Production Dollar (USD), Buyer Name, Customer Name, Operator Name, Machine No — see the note on that page for the full list).
3. A **Preview** table appears showing the parsed rows, plus an **Import Summary** with counts (Records Found / Valid / Invalid / Duplicates).
4. Check the Date column in the preview — it should show your dates correctly (see Part 10 for the specific date test).
5. Click **Submit \[N\] Records to Database**.
6. You should see a green message: *"\[date\] report successfully saved to database."*

If you see a red error message instead, it will show the **actual database error** (not a generic failure) — send that exact text if you need help.

---

## PART 9 — Verify data is permanently saved in Supabase (Point 8)

Don't just trust the dashboard — check the database directly:

1. In Supabase, go to **Table Editor** → click `production_data`.
2. You should see the rows you just imported, with real values in `report_date`, `operator_name`, `production_usd`, etc.
3. This table **is** the permanent storage — it's not a cache. As long as this table has the row, the data exists, regardless of what any browser shows.

---

## PART 10 — Verify data survives logout, refresh, and reopening (Point 9)

Run through this exact sequence:

1. With data already imported (Part 8), **refresh the browser page** (F5). Log in again if it asks. → The data should still appear in the dashboard (Overview KPIs, Data Table, etc.).
2. Click **Logout** (top right).
3. Log back in with the same Admin account. → Data should still be there.
4. Close the browser tab completely, reopen the site's URL fresh. Log in again. → Data should still be there.
5. If you deployed already (Part 13), open the site on your phone or a different computer and log in. → Same data should appear, because it all comes from the same Supabase database, not from any one browser.

If data ever disappears after a refresh, that means the app fell back to local demo mode — check that `.env.local` (or the Vercel environment variables, once deployed) are set correctly, per Part 6 / Part 14.

---

## PART 11 — Test the date fix specifically (Point 10)

This directly tests the bug you reported.

1. Prepare a small test file (CSV is easiest) with one row dated **`03/09/2026`** — you can literally make a 2-line CSV in Notepad:
   ```
   Date,MC Type,Shift,Job Number,Unit Price,Production PCS,Production Dollar (USD),Buyer Name,Customer Name,Operator Name,Machine No
   03/09/2026,Flexo,Shift-A,TEST001,0.05,1000,50,Test Buyer,Test Customer,Test Operator,1
   ```
   Save it as `date-test.csv`.
2. Go to **Import Data**, upload `date-test.csv`.
3. In the **Preview** table, check the Date column — it must show **`03/09/2026`**, not `01/08/2026` or anything else.
4. Click Submit.
5. Go to Supabase → **Table Editor** → `production_data`, find the new row, and check the `report_date` column — it must show exactly **`2026-09-03`**.
6. Back in the dashboard, go to the global **Date** filter (top of any page) → choose **Custom Range** → set both From and To to `2026-09-03`. Only your test row should appear.
7. Repeat with `31/08/2026` and confirm it stores as `2026-08-31` — this specifically tests the day/month order isn't swapped.

---

## PART 12 — Test the $28,000 daily target (Point 11)

1. Go to **Overview**. At the top you'll see a card: **Daily Production Target** showing `Daily Target: $28,000`, `Actual Production`, and `Achievement %`.
2. "Actual Production" is the sum of Production USD for the most recent date in your database. Import a report where the total Production USD for that date is, say, $35,000, and confirm Achievement shows **125%** (it's allowed to go above 100%).
3. To change the $28,000 figure: go to **Settings** → **Daily Production Target** field → change the number → **Save Settings**. Go back to Overview and confirm the card updated.
   - Only Admin and Manager accounts can change this (Operators see it as read-only — see Part 13).

---

## PART 13 — Test Admin, Manager, and Operator roles (Point 12)

You already have one Admin account. Create two more test accounts to check the other roles:

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**. Make one for a test Manager (e.g. `manager-test@yourcompany.com`) and one for a test Operator (e.g. `operator-test@yourcompany.com`), each with **Auto Confirm User** checked.
2. Go to **Table Editor** → `profiles`. Find the manager row, set `role` to `manager`. Leave the operator row's `role` as `operator` (that's the default).
3. Log out of the dashboard, log in as the **manager** test account. Confirm:
   - You can see the dashboard, filters, and reports. ✅
   - **Import Data** is visible in the sidebar and works. ✅
   - **User Management** is **not** visible in the sidebar. ✅
   - Settings fields are editable. ✅
4. Log out, log in as the **operator** test account. Confirm:
   - You can see the dashboard and use filters. ✅
   - **Import Data** is **not** visible in the sidebar. ✅
   - **User Management** is **not** visible. ✅
   - Settings page shows a "read-only" notice and the fields are greyed out. ✅
5. Log back in as **Admin**. Confirm:
   - **User Management** is visible. Open it — you should see all three accounts listed, with dropdowns to change role and buttons to toggle Active/Disabled.
   - Try disabling the operator test account (click its Active/Disabled button). Then try logging in as that operator — it should reject the login with a "disabled" message.

---

## PART 14 — Deploy to GitHub and Vercel (Point 13)

### A. Push to GitHub

1. Go to [github.com/new](https://github.com/new), create a new repository (e.g. name it `pfl-dashboard`). Leave it empty (don't add a README) and click **Create repository**.
2. Back in your terminal, inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/pfl-dashboard.git
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your actual GitHub username. If this is your first time using Git, it may ask you to log in (a browser window will pop up) — follow the prompts.

### B. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new), log in (with GitHub, for convenience).
2. Click **Import** next to the `pfl-dashboard` repository you just pushed. (If you don't see it, click "Adjust GitHub App Permissions" and grant Vercel access to that repo.)
3. Vercel auto-detects "Vite" as the framework. **Before clicking Deploy**, expand **Environment Variables** (see Part 15 below — you must add them now or the first deploy will show the "Supabase not configured" warning).
4. Click **Deploy**. Wait 1–2 minutes.
5. Once done, Vercel gives you a URL like `https://pfl-dashboard-yourname.vercel.app`. Open it, log in with your Admin account, and confirm everything works exactly as it did locally.

---

## PART 15 — Environment variables in Vercel (Point 14)

Add these two, either during the import screen (step B.3 above) or afterward:

1. Open your project on [vercel.com](https://vercel.com/dashboard), click it, go to **Settings** → **Environment Variables**.
2. Add each one:
   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the Project URL from Part 4 |
   | `VITE_SUPABASE_ANON_KEY` | the anon public key from Part 4 |
3. For each, tick all three environment boxes: **Production**, **Preview**, **Development**.
4. Click **Save**.
5. **Important**: environment variable changes only apply to the *next* deployment. If you added these after your first deploy, go to the **Deployments** tab, click the three-dot menu on the latest deployment, and click **Redeploy**.

---

## PART 16 — If `npm install` or `npm run build` shows an error (Point 15)

1. **Copy the exact error text** — the full red block, not a summary. This is the single most important thing; guessing wastes time.
2. Common quick fixes to try first, in this order:
   - **"node: command not found" / npm not recognized**: Node.js isn't installed. Install it from [nodejs.org](https://nodejs.org) (LTS version), then close and reopen your terminal.
   - **Errors mentioning `ENOENT` or "no such file or directory"**: you're not in the right folder. Run `pwd` (Mac) or `cd` (Windows, no arguments) to see where you are, then `cd` into the actual project folder (the one containing `package.json`).
   - **Errors during `npm install` mentioning specific packages (403, 404, network)**: try again — `npm install` a second time often succeeds after a flaky network blip. If it keeps failing, run `npm cache clean --force` then `npm install` again.
   - **`npm run build` errors mentioning a specific file and line number**: this usually means a real code problem — copy the full error and send it to me along with which file/line it points to. Don't try to guess-edit the code yourself first.
   - **Build succeeds locally but fails only on Vercel**: check the **Deployments** tab → click the failed deployment → **Build Logs**. Copy the error from there. This is often a missing environment variable (Part 15) or a Node version mismatch — if so, tell me and I'll add a `.nvmrc`/`engines` field to pin the Node version.
3. Never try to "fix" an error by deleting large parts of the project or reinstalling everything from scratch as a first move — that can hide the real cause. Send me the exact error first.

---

## Quick reference — where everything lives

| What | Where |
|---|---|
| Database tables & data | Supabase → Table Editor |
| Run SQL / schema.sql | Supabase → SQL Editor |
| Create/manage logins | Supabase → Authentication → Users |
| Change someone's role after first Admin exists | Dashboard → User Management (Admin only) |
| API keys | Supabase → Project Settings → API |
| Local env vars | `.env.local` in the project root (never committed to Git) |
| Vercel env vars | Vercel → your project → Settings → Environment Variables |
| Source code | `src/pfl-dashboard.jsx` (main app), `src/lib/dateUtils.js` (date parsing), `src/components/` (login, auth, user management) |
