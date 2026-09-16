import { useState } from "react";
import { saveClient } from "@/lib/orgs.functions";
import {
  ACCOUNT_STATUSES,
  ALL_MODULES_ON,
  CLIENT_TYPES,
  MEMBER_ROLES,
  MEMBER_ROLE_LABELS,
  MODULES,
  type ClientSummary,
  type MemberRole,
} from "@/lib/org-constants";

// Guided setup for a brand-new consulting client. A new client always starts
// with an empty workspace: nothing is copied from any other client.

type Invite = { email: string; role: MemberRole; fullName: string };

type Draft = {
  name: string;
  clientType: string;
  primaryContact: string;
  contactTitle: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  projectName: string;
  contractStart: string;
  contractEnd: string;
  accountStatus: string;
  internalNotes: string;
  modules: Record<string, boolean>;
};

const EMPTY: Draft = {
  name: "",
  clientType: "Church / Ministry",
  primaryContact: "",
  contactTitle: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  website: "",
  projectName: "",
  contractStart: "",
  contractEnd: "",
  accountStatus: "Setup",
  internalNotes: "",
  modules: { ...ALL_MODULES_ON },
};

const STEPS = ["Organization", "Contact", "Project", "Modules", "People", "Review"];

export default function ClientWizard({
  existing,
  onClose,
  onSaved,
}: {
  existing?: ClientSummary | null;
  onClose: () => void;
  onSaved: (client: ClientSummary) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(
    existing
      ? {
          name: existing.name,
          clientType: existing.clientType || "Church / Ministry",
          primaryContact: existing.primaryContact ?? "",
          contactTitle: existing.contactTitle ?? "",
          email: existing.email ?? "",
          phone: existing.phone ?? "",
          address: existing.address ?? "",
          city: existing.city ?? "",
          state: existing.state ?? "",
          zip: existing.zip ?? "",
          website: existing.website ?? "",
          projectName: existing.projectName ?? "",
          contractStart: existing.contractStart ?? "",
          contractEnd: existing.contractEnd ?? "",
          accountStatus: existing.accountStatus || "Setup",
          internalNotes: existing.internalNotes ?? "",
          modules: { ...ALL_MODULES_ON, ...(existing.modules ?? {}) },
        }
      : EMPTY,
  );
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invite, setInvite] = useState<Invite>({ email: "", role: "client_admin", fullName: "" });
  const [logo, setLogo] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const pickLogo = async (file: File | null) => {
    if (!file) return setLogo(null);
    const buf = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    buf.forEach((b) => (binary += String.fromCharCode(b)));
    setLogo({ base64: btoa(binary), name: file.name, type: file.type || "image/png" });
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await saveClient({
        data: {
          id: existing?.id ?? null,
          ...draft,
          logoBase64: logo?.base64 ?? null,
          logoName: logo?.name ?? null,
          logoContentType: logo?.type ?? null,
          invites: invites.map((i) => ({ email: i.email, role: i.role, fullName: i.fullName })),
        },
      });
      onSaved(result.client as ClientSummary);
    } catch (e) {
      setError((e as Error).message || "Could not save that client");
    } finally {
      setBusy(false);
    }
  };

  const canContinue = step !== 0 || draft.name.trim().length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {existing ? "Client settings" : "Add new client"}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
              {!existing && " · a new client starts completely empty"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-kairos-gold" : "bg-white/10"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <Field label="Organization name" required>
              <input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="The Lighthouse Church and Ministries"
                className={inputCls}
              />
            </Field>
            <Field label="Client type">
              <select
                value={draft.clientType}
                onChange={(e) => set({ clientType: e.target.value })}
                className={inputCls}
              >
                {CLIENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Logo (optional)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void pickLogo(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-slate-400"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary contact">
              <input value={draft.primaryContact} onChange={(e) => set({ primaryContact: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Title">
              <input value={draft.contactTitle} onChange={(e) => set({ contactTitle: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Email">
              <input value={draft.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Street address">
              <input value={draft.address} onChange={(e) => set({ address: e.target.value })} className={inputCls} />
            </Field>
            <Field label="City">
              <input value={draft.city} onChange={(e) => set({ city: e.target.value })} className={inputCls} />
            </Field>
            <Field label="State">
              <input value={draft.state} onChange={(e) => set({ state: e.target.value })} className={inputCls} />
            </Field>
            <Field label="ZIP">
              <input value={draft.zip} onChange={(e) => set({ zip: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Website">
              <input value={draft.website} onChange={(e) => set({ website: e.target.value })} className={inputCls} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project name">
              <input value={draft.projectName} onChange={(e) => set({ projectName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Account status">
              <select value={draft.accountStatus} onChange={(e) => set({ accountStatus: e.target.value })} className={inputCls}>
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contract start">
              <input type="date" value={draft.contractStart} onChange={(e) => set({ contractStart: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Contract end">
              <input type="date" value={draft.contractEnd} onChange={(e) => set({ contractEnd: e.target.value })} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Internal notes (Kairos only)">
                <textarea
                  rows={4}
                  value={draft.internalNotes}
                  onChange={(e) => set({ internalNotes: e.target.value })}
                  className={`${inputCls} h-auto py-2`}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={draft.modules[m.key] !== false}
                  onChange={(e) => set({ modules: { ...draft.modules, [m.key]: e.target.checked } })}
                />
                {m.label}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-500">
              Invited people can only ever see this client. Kairos roles are for your own team.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                placeholder="name@client.org"
                className={inputCls}
              />
              <input
                value={invite.fullName}
                onChange={(e) => setInvite({ ...invite, fullName: e.target.value })}
                placeholder="Full name (optional)"
                className={inputCls}
              />
              <select
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value as MemberRole })}
                className={inputCls}
              >
                {MEMBER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {MEMBER_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email.trim())) return;
                setInvites([...invites, { ...invite, email: invite.email.trim().toLowerCase() }]);
                setInvite({ email: "", role: "client_admin", fullName: "" });
              }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white"
            >
              + Add person
            </button>
            <ul className="space-y-1">
              {invites.map((i, idx) => (
                <li
                  key={`${i.email}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-200"
                >
                  <span>
                    {i.email} · {MEMBER_ROLE_LABELS[i.role]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInvites(invites.filter((_, n) => n !== idx))}
                    className="text-[10px] text-red-400"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-2 text-xs text-slate-300">
            <Review label="Organization" value={draft.name} />
            <Review label="Type" value={draft.clientType} />
            <Review label="Contact" value={[draft.primaryContact, draft.email, draft.phone].filter(Boolean).join(" · ")} />
            <Review label="Project" value={draft.projectName} />
            <Review label="Status" value={draft.accountStatus} />
            <Review
              label="Modules"
              value={MODULES.filter((m) => draft.modules[m.key] !== false).map((m) => m.label).join(", ")}
            />
            <Review label="People invited" value={invites.map((i) => i.email).join(", ") || "None yet"} />
            {!existing && (
              <p className="pt-2 text-[11px] text-kairos-gold">
                This client will start with a completely empty workspace.
              </p>
            )}
          </div>
        )}

        {error && <div className="mt-4 text-[11px] text-red-400">{error}</div>}

        <div className="flex items-center justify-between gap-2 mt-6">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 disabled:opacity-30"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-2 rounded-lg bg-kairos-blue text-white text-xs font-bold uppercase tracking-wider disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="px-4 py-2 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold uppercase tracking-wider disabled:opacity-40"
            >
              {busy ? "Saving…" : existing ? "Save client" : "Create client"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "h-9 w-full px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        {label}
        {required && <span className="text-kairos-gold"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-white/5 pb-1">
      <span className="w-32 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="text-slate-200">{value || "—"}</span>
    </div>
  );
}
