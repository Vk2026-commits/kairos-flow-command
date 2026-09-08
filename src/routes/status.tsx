import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listCodeStatus, diagnoseCode, type CodeStatusRow } from "@/lib/code-status.functions";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Kairos Command™ — Access Code Status" },
      {
        name: "description",
        content: "Check which Kairos Command access codes are active, switched off, or never used, and test a code instantly.",
      },
      { property: "og:title", content: "Kairos Command™ — Access Code Status" },
      { property: "og:description", content: "Live health view of Kairos Command device access codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CodeStatusPage,
});

const STATE_LABEL: Record<CodeStatusRow["state"], { text: string; cls: string }> = {
  "active-used": { text: "Active · in use", cls: "border-emerald-500/40 text-emerald-400" },
  "active-unused": { text: "Active · never used", cls: "border-kairos-gold/40 text-kairos-gold" },
  revoked: { text: "Switched off", cls: "border-red-500/40 text-red-400" },
};

function CodeStatusPage() {
  const [rows, setRows] = useState<CodeStatusRow[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [probe, setProbe] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; verdict: string; detail: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listCodeStatus();
      setRows(res.rows);
      setReason(res.reason);
    } catch {
      setReason("Could not reach the access code list right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const test = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probe.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res: any = await diagnoseCode({ data: { code: probe.trim() } });
      setResult({ ok: Boolean(res?.ok), verdict: String(res?.verdict ?? ""), detail: String(res?.detail ?? "") });
    } catch {
      setResult({ ok: false, verdict: "The check could not run", detail: "Please try again in a moment." });
    } finally {
      setBusy(false);
    }
  };

  const active = rows.filter((r) => r.state !== "revoked").length;
  const unused = rows.filter((r) => r.state === "active-unused").length;
  const off = rows.filter((r) => r.state === "revoked").length;

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-surface/60 backdrop-blur-md">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Kairos Command<span className="text-kairos-gold">™</span>
          <span className="ml-3 text-xs font-mono tracking-widest text-slate-500 uppercase">Access Code Status</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-xs font-semibold text-kairos-gold hover:text-white transition">Admin</Link>
          <Link to="/" className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Active codes" value={active} />
          <Stat label="Never used yet" value={unused} />
          <Stat label="Switched off" value={off} />
        </div>

        <div className="rounded-2xl border border-white/5 bg-surface p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-1">Test a code</h2>
          <p className="text-xs text-slate-400 mb-4">
            Type the code exactly as you would on the entry screen. You will be told whether it works, and if not, why.
          </p>
          <form onSubmit={test} className="flex flex-wrap items-center gap-2">
            <input
              value={probe}
              onChange={(e) => setProbe(e.target.value.toUpperCase())}
              placeholder="KAIROS2026"
              className="h-9 px-3 rounded-lg bg-bg-deep border border-white/10 font-mono text-sm tracking-widest text-white focus:outline-none focus:border-kairos-blue"
            />
            <button
              type="submit"
              disabled={busy || !probe.trim()}
              className="h-9 px-4 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold disabled:opacity-40"
            >
              {busy ? "Checking…" : "Check code"}
            </button>
          </form>
          {result && (
            <div
              className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                result.ok ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300" : "border-red-500/40 bg-red-500/5 text-red-300"
              }`}
            >
              <div className="font-semibold">{result.verdict}</div>
              <div className="text-[11px] text-slate-400 mt-1">{result.detail}</div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Codes on file</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="text-[11px] font-semibold px-2 py-1 rounded border border-white/15 text-slate-300 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {loading && <div className="text-xs text-slate-500">Loading…</div>}
          {reason && <div className="text-[11px] text-red-400 mb-3">{reason}</div>}
          {!loading && rows.length === 0 && !reason && (
            <div className="text-xs text-slate-500">No codes have been created yet.</div>
          )}

          <ul className="space-y-1">
            {rows.map((r, i) => {
              const s = STATE_LABEL[r.state];
              return (
                <li
                  key={`${r.masked}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-white truncate">{r.masked}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {r.label || "No label"} · {r.role} ·{" "}
                      {r.lastUsedAt ? `last used ${new Date(r.lastUsedAt).toLocaleString()}` : "never used"}
                      {r.createdAt ? ` · added ${new Date(r.createdAt).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${s.cls}`}>{s.text}</span>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] text-slate-500 mt-4">
            Codes are shown partly hidden on purpose so this page can be opened on any screen. Use the Invited Devices list
            on the Admin page to copy, create, switch off or restore a code.
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface px-4 py-3">
      <div className="text-2xl font-mono text-white">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  );
}
