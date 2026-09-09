import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaffAccount, listStaff, setStaffRole, type StaffRole } from "@/lib/staff.functions";

// Admin panel: see every staff account and set what each person may do.
const LEVELS: { value: StaffRole; label: string; hint: string }[] = [
  { value: "admin", label: "Full admin", hint: "Everything, including everyone's hours" },
  { value: "contributor", label: "Add notes & hours", hint: "Logs their own hours and notes only" },
  { value: "viewer", label: "Read only", hint: "Can look, cannot change anything" },
];

type StaffRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  title: string | null;
  role: StaffRole;
  isMe: boolean;
};

const card = "rounded-2xl border border-white/5 bg-surface p-5";

export default function StaffAccounts() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const me: any = await getMyStaffAccount({ data: {} as any });
      setMyRole(me.role as StaffRole);
      if (me.role !== "admin") return;
      const res: any = await listStaff({ data: {} as any });
      setRows((res?.staff ?? []) as StaffRow[]);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Could not load staff accounts");
    }
  };

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setSignedIn(Boolean(data.user));
      if (data.user) await load();
    })();
  }, []);

  const change = async (row: StaffRow, role: StaffRole) => {
    setBusy(row.id);
    setError(null);
    try {
      await setStaffRole({ data: { userId: row.id, role } });
      await load();
    } catch (e) {
      setError((e as Error).message || "Could not change that permission level");
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSignedIn(false);
    setMyRole(null);
    setRows([]);
  };

  if (signedIn === null) return null;

  if (!signedIn) {
    return (
      <div className={`${card} max-w-xl`}>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-1">Staff Accounts</h2>
        <p className="text-xs text-slate-400 mb-4">
          Sign in with your own account to manage staff and permission levels.
        </p>
        <Link to="/auth" className="inline-block px-4 h-10 leading-10 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Staff Accounts</h2>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          You are {LEVELS.find((l) => l.value === myRole)?.label ?? "read only"}
        </span>
        <button type="button" onClick={signOut} className="ml-auto text-[11px] text-slate-400 hover:text-white transition">
          Sign out
        </button>
      </div>

      {error && <div className="text-[11px] text-red-400 mb-3">{error}</div>}

      {myRole !== "admin" ? (
        <p className="text-xs text-slate-400">
          Only a full admin can change permission levels. Ask the project owner to raise your level.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-bg-deep px-3 py-2"
              >
                <div className="min-w-[180px]">
                  <div className="text-sm text-white">
                    {row.fullName || row.email || "Staff member"}
                    {row.isMe && <span className="ml-2 text-[10px] uppercase text-kairos-gold">you</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">{row.email}</div>
                </div>
                <select
                  value={row.role}
                  disabled={busy === row.id}
                  onChange={(e) => void change(row, e.target.value as StaffRole)}
                  className="ml-auto h-9 px-2 rounded-lg bg-surface border border-white/10 text-xs text-white"
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {rows.length === 0 && <p className="text-xs text-slate-500">No staff accounts yet.</p>}
          </div>

          <ul className="mt-4 space-y-1 text-[11px] text-slate-500">
            {LEVELS.map((l) => (
              <li key={l.value}>
                <span className="text-slate-300">{l.label}</span> — {l.hint}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
