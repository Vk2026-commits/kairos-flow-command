import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { archiveClient, kairosPortfolio } from "@/lib/orgs.functions";
import { ACCOUNT_STATUSES, type ClientSummary } from "@/lib/org-constants";
import { useClients } from "@/lib/use-clients";
import ClientWizard from "@/components/ClientWizard";

export const Route = createFileRoute("/portfolio")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kairos Portfolio — All Clients | Kairos Command" },
      {
        name: "description",
        content:
          "Kairos Security portfolio view: every consulting client, open action items, pending decisions, upcoming site visits and consulting hours in one place.",
      },
      { property: "og:title", content: "Kairos Portfolio — All Clients" },
      {
        property: "og:description",
        content:
          "Every Kairos Security consulting client with open actions, decisions, visits and hours side by side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

type PortfolioClient = ClientSummary & {
  openActions: number;
  criticalActions: number;
  pendingDecisions: number;
  siteVisits: number;
  nextVisit: string | null;
  latestAssessment: string | null;
  hours: number;
  hoursThisMonth: number;
  lastActivity: string | null;
  phase: string | null;
  projectStatus: string | null;
  nextMilestone: string | null;
};

function PortfolioPage() {
  const navigate = useNavigate();
  const { switchClient } = useClients();
  const [clients, setClients] = useState<PortfolioClient[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ClientSummary | null>(null);

  const load = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      const result = await kairosPortfolio();
      setClients(result.clients as PortfolioClient[]);
      setTotals(result.totals as Record<string, number>);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans">
      <header className="border-b border-white/5 bg-surface/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Kairos Command<span className="text-kairos-gold">™</span>
          <span className="ml-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Kairos Portfolio
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/staff"
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white"
          >
            Staff Portal
          </Link>
          <Link
            to="/admin"
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {loading && <p className="text-xs uppercase tracking-widest text-slate-500">Loading portfolio…</p>}
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Stat label="Active clients" value={totals.activeClients ?? 0} />
              <Stat label="Engagements" value={totals.activeEngagements ?? 0} />
              <Stat label="Assessments this month" value={totals.assessmentsThisMonth ?? 0} />
              <Stat label="Critical / high actions" value={totals.criticalActions ?? 0} tone="alert" />
              <Stat label="Decisions pending" value={totals.pendingDecisions ?? 0} />
              <Stat label="Hours this month" value={Number((totals.hoursThisMonth ?? 0).toFixed(2))} />
            </div>

            <div className="rounded-2xl border border-white/5 bg-surface overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Phase</th>
                    <th className="text-right px-3 py-3">Open actions</th>
                    <th className="text-right px-3 py-3">Critical</th>
                    <th className="text-right px-3 py-3">Decisions</th>
                    <th className="text-left px-3 py-3">Next visit</th>
                    <th className="text-right px-3 py-3">Hours</th>
                    <th className="text-right px-4 py-3">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.logoUrl ? (
                            <img src={c.logoUrl} alt={`${c.name} logo`} className="size-6 rounded object-cover" />
                          ) : (
                            <span className="grid size-6 place-items-center rounded bg-white/10 text-[9px] font-bold">
                              {c.name.slice(0, 1)}
                            </span>
                          )}
                          <div>
                            <div className="text-white font-semibold">{c.name}</div>
                            <div className="text-[10px] text-slate-500">{c.projectName || c.clientType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={c.accountStatus}
                          onChange={async (e) => {
                            await archiveClient({ data: { orgId: c.id, status: e.target.value } });
                            await load();
                          }}
                          className="h-7 px-2 rounded bg-bg-deep border border-white/10 text-[10px] text-slate-200"
                        >
                          {ACCOUNT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-slate-400">{c.phase || "—"}</td>
                      <td className="px-3 py-3 text-right">{c.openActions}</td>
                      <td className={`px-3 py-3 text-right ${c.criticalActions ? "text-red-400 font-bold" : ""}`}>
                        {c.criticalActions}
                      </td>
                      <td className="px-3 py-3 text-right">{c.pendingDecisions}</td>
                      <td className="px-3 py-3 text-slate-400">{c.nextVisit ?? "—"}</td>
                      <td className="px-3 py-3 text-right font-mono">{c.hours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(c)}
                            className="text-[10px] font-bold px-2 py-1 rounded border border-white/15 text-slate-300"
                          >
                            Settings
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await switchClient(c.id);
                              void navigate({ to: "/staff" });
                            }}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-kairos-blue text-white"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {editing && (
        <ClientWizard
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-xl ${tone === "alert" && value > 0 ? "text-red-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
