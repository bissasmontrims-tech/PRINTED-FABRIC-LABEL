/**
 * Centralized role/permission checks. Mirrors the RLS policies in
 * supabase/schema.sql and supabase/daily_plan_entries.sql — the server is
 * still the real enforcement point, this only controls what the UI shows/hides.
 */
export const ROLES = ["admin", "manager", "operator", "supervisor"];
export const SUPERVISOR_NAMES = ["Aslam", "Murad", "Biplob", "Selim Reza", "Shahjahan"];

export function can(profile, action) {
  const role = profile?.role;
  if (!profile?.is_active) return false;
  switch (action) {
    case "view_dashboard":
      return ROLES.includes(role);
    case "import_data":
      return role === "admin" || role === "manager";
    case "edit_data":
    case "delete_data":
    case "manage_users":
      return role === "admin";
    // Daily Plan (job-entry) permissions — see supabase/daily_plan_entries.sql.
    // Admin can view/manage all entries, Manager can view all entries read-only,
    // Supervisor can view/manage only their own entries; Operator has none.
    case "view_all_daily_plan_entries":
      return role === "admin" || role === "manager";
    case "submit_own_daily_plan_entry":
      return role === "supervisor" && Boolean(profile.supervisor_name);
    // Nav visibility: admin or supervisor can always reach the page, even if
    // a supervisor's account isn't linked to a name yet — the page itself
    // explains that case rather than the nav item silently disappearing.
    case "access_daily_plan":
      return role === "admin" || role === "manager" || role === "supervisor";
    default:
      return false;
  }
}

