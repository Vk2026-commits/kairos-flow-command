import { useEffect, useState } from "react";
import {
  inviteClientUser,
  listClientAudit,
  listClientUsers,
  resendClientInvitation,
  updateClientUser,
} from "@/lib/orgs.functions";
import { MEMBER_ROLES, MEMBER_ROLE_LABELS, type MemberRole } from "@/lib/org-constants";
import { useClients } from "@/lib/use-clients";

// People who may sign in for the client you are currently working in, plus the
// history of what was changed in that client's workspace.

type Member = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  role: MemberRole;
  status: string;
  invitationStatus: string;
  lastLoginAt: string | null;
  isMe: boolean;
};

type Entry = {
  id: string;
  actor: string;
  action: string;
  recordType: string | null;
  recordLabel: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
};

export default function ClientUsers() {
  const { activeClient, activeOrgId, isSuperAdmin, memberRole } = useClients();
  const [members, setMembers] = useState<Member[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<MemberRole>("client_leadership");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canManage = isSuperAdmin || memberRole === "client_admin";

  const load = async () => {
    if (!activeOrgId) return;
    try {
      const [users, audit] = await Promise.all([
        listClientUsers({ data: {} }),
        listClientAudit({ data: {} }),
      ]);
      setMembers(users.members as Member[]);
      setEntries(audit.entries as Entry[]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId]);

  if (!canManage) return null;

  const invite = async () => {
    try {
      await inviteClientUser({ data: { email, role, fullName } });
      setEmail("");
      setFullName("");
      setNotice("Invitation sent. They will see only this client when they sign in.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const update = async (memberId: string, patch: { role?: MemberRole; status?: string }) => {
    try {
      await updateClientUser({ data: { memberId, ...patch } });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-surface p-6 mt-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-1">
        Client users — {activeClient?.name ?? "current client"}
      </h3>
      <p className="text-[11px] text-slate-500 mb-4">
        Everyone listed here can sign in to this client only. Their view is limited by the role you give them.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@client.org"
          className="h-9 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white"
        />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name (optional)"
          className="h-9 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          className="h-9 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white"
        >
          {MEMBER_ROLES.filter((r) => isSuperAdmin || !r.startsWith("kairos_")).map((r) => (
            <option key={r} value={r}>
              {MEMBER_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void invite()}
          className="h-9 px-4 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold"
        >
          + Invite user
        </button>
      </div>

      {error && <div className="mb-2 text-[11px] text-red-400">{error}</div>}
      {notice && <div className="mb-2 text-[11px] text-emerald-400">{notice}</div>}

      <ul className="space-y-1">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm text-white truncate">
                {m.name || m.email || "Invited user"}
                {m.isMe && <span className="ml-2 text-[10px] text-emerald-400">you</span>}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {m.email} ·{" "}
                {m.invitationStatus === "invited" ? "invitation pending" : m.status === "disabled" ? "disabled" : "active"}
                {m.lastLoginAt ? ` · last sign-in ${new Date(m.lastLoginAt).toLocaleDateString()}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                onChange={(e) => void update(m.id, { role: e.target.value as MemberRole })}
                className="h-7 px-2 rounded bg-bg-deep border border-white/10 text-[10px] text-slate-200"
              >
                {MEMBER_ROLES.filter((r) => isSuperAdmin || !r.startsWith("kairos_")).map((r) => (
                  <option key={r} value={r}>
                    {MEMBER_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              {m.invitationStatus === "invited" && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resendClientInvitation({ data: { memberId: m.id } });
                      setNotice("Invitation re-sent.");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                  className="text-[10px] font-bold px-2 py-1 rounded border border-white/15 text-slate-300"
                >
                  Resend
                </button>
              )}
              {!m.isMe && (
                <button
                  type="button"
                  onClick={() => void update(m.id, { status: m.status === "disabled" ? "active" : "disabled" })}
                  className={`text-[10px] font-bold px-2 py-1 rounded border transition ${
                    m.status === "disabled"
                      ? "border-emerald-500/40 text-emerald-400"
                      : "border-red-500/40 text-red-400"
                  }`}
                >
                  {m.status === "disabled" ? "Enable" : "Disable"}
                </button>
              )}
            </div>
          </li>
        ))}
        {members.length === 0 && (
          <li className="text-[11px] text-slate-500">No one has been invited to this client yet.</li>
        )}
      </ul>

      <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
        Change history
      </h4>
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {entries.map((e) => (
          <li key={e.id} className="rounded-lg border border-white/5 px-3 py-2 text-[11px] text-slate-300">
            <span className="font-mono text-slate-500">
              {new Date(e.createdAt).toLocaleString()}
            </span>{" "}
            · {e.actor} · {e.action}
            {e.recordLabel ? ` — ${e.recordLabel}` : ""}
            {e.previousStatus || e.newStatus
              ? ` (${e.previousStatus ?? "—"} → ${e.newStatus ?? "—"})`
              : ""}
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-[11px] text-slate-500">Nothing has been changed in this client yet.</li>
        )}
      </ul>
    </div>
  );
}
