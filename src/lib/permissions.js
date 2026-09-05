/**
 * Centralized role/permission checks. Mirrors the RLS policies in
 * supabase/schema.sql — the server is still the real enforcement point,
 * this only controls what the UI shows/hides.
 */
export const ROLES = ["admin", "manager", "operator"];

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
    default:
      return false;
  }
}
