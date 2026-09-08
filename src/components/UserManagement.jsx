import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Users, ShieldCheck, ShieldAlert } from "lucide-react";
import { SUPERVISOR_NAMES } from "../lib/permissions";

const ROLE_OPTIONS = ["admin", "manager", "operator", "supervisor"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
    if (error) setErr(error.message); else setUsers(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateUser(id, patch) {
    setErr("");
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) { setErr(`Update failed: ${error.message}`); return; }
    load();
  }

  // Which supervisor_name values are already taken by a DIFFERENT user —
  // the DB has a unique constraint on this too, but showing it here avoids
  // a confusing round-trip error.
  function takenBy(name, excludingUserId) {
    return users.find((u) => u.supervisor_name === name && u.id !== excludingUserId);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-blue-600" />
        <h2 className="text-base font-semibold text-slate-800">User Management</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        New accounts are created by inviting a user from the Supabase dashboard
        (Authentication → Users → Add user) — the frontend never handles the
        Service Role Key, so account creation happens there. Once a user signs
        up, they appear below and you can set their role, disable them, or —
        for the "supervisor" role — link them to which supervisor they are.
      </p>
      {err && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">{err}</div>}
      {loading ? (
        <div className="text-sm text-slate-400">Loading users…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Email</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Full Name</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Role</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Supervisor</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-700">{u.email}</td>
                  <td className="px-3 py-2 text-slate-500">{u.full_name || "—"}</td>
                  <td className="px-3 py-2">
                    <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value, ...(e.target.value !== "supervisor" ? { supervisor_name: null } : {}) })}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1">
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {u.role === "supervisor" ? (
                      <select value={u.supervisor_name || ""} onChange={(e) => updateUser(u.id, { supervisor_name: e.target.value || null })}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1">
                        <option value="">— choose —</option>
                        {SUPERVISOR_NAMES.map((name) => {
                          const clash = takenBy(name, u.id);
                          return <option key={name} value={name} disabled={Boolean(clash)}>{name}{clash ? ` (linked to ${clash.email})` : ""}</option>;
                        })}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${u.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {u.is_active ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                      {u.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
