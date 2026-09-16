import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useClients } from "@/lib/use-clients";
import ClientWizard from "./ClientWizard";

// Always-visible reminder of which client you are working in, plus the switcher
// for Kairos staff who work with several clients.

export default function ClientSwitcher({ compact = false }: { compact?: boolean }) {
  const { clients, activeClient, activeOrgId, isSuperAdmin, switchClient, switchingTo, refresh, loading, error } =
    useClients();
  const [open, setOpen] = useState(false);
  const [wizard, setWizard] = useState(false);

  // Nothing to show on shared devices that are not signed in.
  if (error) return null;

  if (loading && !activeClient) {
    return <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Loading client…</span>;
  }

  const live = clients.filter((c) => c.accountStatus !== "Archived");
  const archived = clients.filter((c) => c.accountStatus === "Archived");
  const only = clients.length <= 1 && !isSuperAdmin;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !only && setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border border-kairos-gold/30 bg-white/5 ${
          compact ? "px-2 py-1" : "px-3 py-2"
        } text-left transition hover:bg-white/10`}
      >
        {activeClient?.logoUrl ? (
          <img src={activeClient.logoUrl} alt={`${activeClient.name} logo`} className="size-6 rounded object-cover" />
        ) : (
          <span className="grid size-6 place-items-center rounded bg-kairos-gold/20 text-[10px] font-bold text-kairos-gold">
            {(activeClient?.name ?? "K").slice(0, 1)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Client</span>
          <span className="block max-w-[180px] truncate text-xs font-semibold text-white">
            {activeClient?.name ?? "No client selected"}
          </span>
        </span>
        {!only && <span className="text-slate-500">▾</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-white/10 bg-surface p-2 shadow-2xl">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Switch client
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {live.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={async () => {
                    if (c.id !== activeOrgId) await switchClient(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition ${
                    c.id === activeOrgId ? "bg-kairos-blue/20 text-white" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded bg-white/10 text-[9px] font-bold">
                    {c.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                    {switchingTo === c.id ? "…" : c.accountStatus}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {archived.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Archived ({archived.length})
              </summary>
              <ul className="space-y-1">
                {archived.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={async () => {
                        await switchClient(c.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-400 hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span className="text-[9px] uppercase tracking-widest">Read only</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {isSuperAdmin && (
            <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setWizard(true);
                  setOpen(false);
                }}
                className="w-full rounded-lg bg-kairos-gold px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-bg-deep"
              >
                + Add new client
              </button>
              <Link
                to="/portfolio"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-slate-300 hover:bg-white/5"
              >
                Kairos Portfolio →
              </Link>
            </div>
          )}
        </div>
      )}

      {wizard && (
        <ClientWizard
          onClose={() => setWizard(false)}
          onSaved={async (client) => {
            setWizard(false);
            refresh();
            await switchClient(client.id);
          }}
        />
      )}
    </div>
  );
}
