/**
 * Single source of truth for date parsing/formatting across the app.
 *
 * Report dates are CALENDAR dates (a day, not a moment in time), so we
 * never round-trip them through `Date` + timezone-aware methods like
 * `toLocaleDateString()` for parsing. Internally every date is stored as a
 * plain "YYYY-MM-DD" string. Display formatting is pure string manipulation
 * on that string — never a `Date` object — so there is no timezone shift
 * possible.
 *
 * Supported input formats (see parseReportDate):
 *  - "DD/MM/YYYY" or "D/M/YYYY"   (the factory report format)
 *  - "YYYY-MM-DD"                 (ISO, e.g. from <input type="date">)
 *  - Excel serial date number     (e.g. 46273)
 *  - JS Date object               (from SheetJS cellDates:true on true
 *                                  Excel date cells)
 */

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * Parse an Excel serial date number into a "YYYY-MM-DD" string.
 * Excel serials are calendar-only (no timezone) so this is pure arithmetic —
 * no Date/timezone involved.
 */
export function excelSerialToISO(serial) {
  // Excel's epoch is 1899-12-30 (accounts for the historical 1900 leap-year bug).
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(utcMs); // safe: we immediately read back only UTC fields
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (y < 1900 || y > 2200) return null;
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

/**
 * Parse a JS Date object into "YYYY-MM-DD" using its UTC fields.
 * SheetJS (cellDates:true) builds date cells with Date.UTC(...), so reading
 * UTC fields back out gives the exact calendar date with no local-timezone
 * shift, regardless of what timezone the browser/server is running in.
 */
export function dateObjToISO(dateObj) {
  if (isNaN(dateObj.getTime())) return null;
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth() + 1;
  const d = dateObj.getUTCDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

const DMY_RE = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/;
const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})/; // allow trailing time part, ignored

function isValidYMD(y, m, d) {
  if (m < 1 || m > 12) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d >= 1 && d <= daysInMonth;
}

/**
 * THE single date parser used everywhere in the app (import, filters,
 * manual entry). Always returns "YYYY-MM-DD" or null if unparseable.
 *
 * Text like "03/09/2026" is ALWAYS interpreted as DD/MM/YYYY — day first,
 * month second — matching the factory report format. It is never guessed
 * as MM/DD/YYYY, and never passed through `new Date(...)` for parsing.
 */
export function parseReportDate(value) {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) return dateObjToISO(value);

  if (typeof value === "number") return excelSerialToISO(value);

  const s = String(value).trim();
  if (!s) return null;

  // ISO first ("2026-09-03", or "2026-09-03T00:00:00.000Z" from a stray Date.toISOString())
  const iso = s.match(ISO_RE);
  if (iso) {
    const y = Number(iso[1]), m = Number(iso[2]), d = Number(iso[3]);
    return isValidYMD(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : null;
  }

  // DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY, DD.MM.YYYY — day is ALWAYS first.
  const dmy = s.match(DMY_RE);
  if (dmy) {
    const d = Number(dmy[1]), m = Number(dmy[2]), y = Number(dmy[3]);
    return isValidYMD(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : null;
  }

  // Last resort: numeric string that's actually an Excel serial (some CSV
  // exports of Excel files leave serials as plain text).
  if (/^\d+(\.\d+)?$/.test(s)) return excelSerialToISO(Number(s));

  return null;
}

/** Display a stored "YYYY-MM-DD" as "DD/MM/YYYY". Pure string ops — no Date object. */
export function formatDisplayDate(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** "YYYY-MM" month key, pure string slice — safe on ISO strings only. */
export function monthKeyOf(iso) { return iso ? iso.slice(0, 7) : "—"; }
/** "YYYY" year key, pure string slice. */
export function yearKeyOf(iso) { return iso ? iso.slice(0, 4) : "—"; }

/**
 * Calendar-arithmetic helpers for date-range presets (Today, This Week,
 * This Month, etc.). These ALWAYS construct and read Date objects via UTC
 * fields only, never local time — mixing the two (e.g. `new Date(iso +
 * "T00:00:00")` then `.toISOString()`) silently shifts the result by a day
 * for any user not at UTC+0, which is exactly the kind of "unnecessary
 * timezone conversion" that must never happen to a calendar date.
 */
function isoToUTCDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function utcDateToISO(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
export function addDaysISO(iso, days) {
  const d = isoToUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateToISO(d);
}
/** Sunday-start week. Returns the ISO date of that week's Sunday. */
export function startOfWeekISO(iso) {
  const d = isoToUTCDate(iso);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return utcDateToISO(d);
}
export function startOfMonthISO(iso) { return iso.slice(0, 8) + "01"; }
export function startOfYearISO(iso) { return iso.slice(0, 4) + "-01-01"; }
export function endOfYearISO(iso) { return iso.slice(0, 4) + "-12-31"; }
/** Last day of the month before `iso`'s month, as "YYYY-MM-DD". */
export function lastDayOfPrevMonthISO(iso) {
  const firstOfThisMonth = startOfMonthISO(iso);
  return addDaysISO(firstOfThisMonth, -1);
}

/**
 * Self-test, run once in dev to catch regressions early (see main.jsx).
 * Throws if any case fails.
 */
export function _runDateParserSelfTest() {
  const cases = [
    ["03/09/2026", "2026-09-03"],
    ["04/09/2026", "2026-09-04"],
    ["05/09/2026", "2026-09-05"],
    ["31/08/2026", "2026-08-31"],
    ["3/9/2026", "2026-09-03"],
    ["2026-09-03", "2026-09-03"],
    [46268, "2026-09-03"], // Excel serial for 2026-09-03
  ];
  for (const [input, expected] of cases) {
    const got = parseReportDate(input);
    if (got !== expected) {
      throw new Error(`Date parser self-test FAILED: parseReportDate(${JSON.stringify(input)}) = ${got}, expected ${expected}`);
    }
  }
  // eslint-disable-next-line no-console
  console.info("[dateUtils] self-test passed:", cases.length, "cases");
}
