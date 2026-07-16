import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useFleetConfig, DEFAULT_FLEET_CONFIG, type FleetConfig } from "@/lib/fleet-config";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kairos Command™ — Admin Settings" },
      { name: "description", content: "Configure fleet counts and operational parameters for the Kairos Command dashboard." },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const [config, setConfig] = useFleetConfig();
  const [draft, setDraft] = useState<FleetConfig>(config);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const dirty = draft.shuttleCount !== config.shuttleCount || draft.golfCartCount !== config.golfCartCount;

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Kairos Command<span className="text-kairos-gold">™</span>
            <span className="ml-3 text-xs font-mono tracking-widest text-slate-500 uppercase">Admin · Fleet Configuration</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/presentation" className="text-xs font-semibold text-slate-400 hover:text-white transition">Presentation</Link>
          <Link to="/" className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="rounded-2xl border border-white/5 bg-surface p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-1">Active Fleet Counts</h2>
          <p className="text-xs text-slate-400 mb-6">
            These values drive the Shuttle Operations dashboard, the Chapter 10 presentation stat card,
            and the live-ops shuttle tracker. Changes take effect immediately across all open windows.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <NumberField
              label="Active Shuttles"
              hint="12-passenger shuttle vans in continuous rotation."
              value={draft.shuttleCount}
              onChange={(n) => setDraft({ ...draft, shuttleCount: n })}
            />
            <NumberField
              label="Golf Carts"
              hint="On-campus mobility carts (ADA / senior / VIP)."
              value={draft.golfCartCount}
              onChange={(n) => setDraft({ ...draft, golfCartCount: n })}
            />
          </div>

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => {
                setConfig(draft);
                setSavedAt(new Date());
              }}
              disabled={!dirty}
              className="px-4 py-2 rounded-lg bg-kairos-blue text-white text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(0,98,255,0.4)] disabled:opacity-40 disabled:shadow-none transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => setDraft(DEFAULT_FLEET_CONFIG)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-300 transition"
            >
              Reset Defaults
            </button>
            {savedAt && !dirty && (
              <span className="text-xs text-emerald-400 font-mono">
                ✓ Saved {savedAt.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-surface p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Current Configuration</h3>
          <div className="font-mono text-sm text-slate-200">
            {config.shuttleCount} active shuttle{config.shuttleCount === 1 ? "" : "s"},{" "}
            {config.golfCartCount} golf cart{config.golfCartCount === 1 ? "" : "s"}
          </div>
        </div>
      </main>
    </div>
  );
}

function NumberField({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="size-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-bold transition"
        >−</button>
        <input
          type="number"
          min={0}
          max={20}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-9 rounded-lg bg-bg-deep border border-white/10 text-center font-mono text-lg text-white focus:outline-none focus:border-kairos-blue"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="size-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-bold transition"
        >+</button>
      </div>
      <span className="block text-[11px] text-slate-500 mt-2">{hint}</span>
    </label>
  );
}
