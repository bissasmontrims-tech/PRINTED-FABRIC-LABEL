import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Users, ShieldCheck, ShieldAlert } from "lucide-react";

const ROLE_OPTIONS = ["admin", "manager", "operator"];

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-blue-600" />
        <h2 className="text-base font-semibold text-slate-800">User Management</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        New accounts are created by inviting a user from the Supabase dashboard
        (Authentication → Users → Invite user) — the frontend never handles the
        Service Role Key, so account creation happens there. Once a user signs
        up, they appear below and you can set their role or disable them.
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
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-700">{u.email}</td>
                  <td className="px-3 py-2 text-slate-500">{u.full_name || "—"}</td>
                  <td className="px-3 py-2">
                    <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1">
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
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
