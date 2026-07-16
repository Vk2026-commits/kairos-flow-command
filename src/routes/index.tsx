import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLiveOps } from "@/hooks/use-live-ops";
import { MapPanel } from "@/components/MapPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kairos Command™ — Live Operations Dashboard" },
      {
        name: "description",
        content:
          "Executive command center for Wheeler Avenue Baptist Church transportation, parking, and shuttle operations.",
      },
    ],
  }),
  component: CommandDashboard,
});

type NavKey = "DASH" | "MAP" | "OPS" | "FLEET" | "COMM" | "KPI";

const NAV: { key: NavKey; label: string }[] = [
  { key: "DASH", label: "Dashboard" },
  { key: "MAP", label: "Maps" },
  { key: "OPS", label: "Ops" },
  { key: "FLEET", label: "Fleet" },
  { key: "COMM", label: "Comms" },
  { key: "KPI", label: "KPIs" },
];

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function CommandDashboard() {
  const [active, setActive] = useState<NavKey>("DASH");
  const [presentation, setPresentation] = useState(false);
  const [service, setService] = useState<"7:00 AM" | "10:00 AM" | "1:00 PM">(
    "10:00 AM",
  );
  const now = useClock();
  const live = useLiveOps();
  const sparkSeed = live.avgShuttleCycleMin;
  const spark = [40, 60, 45, 80, Math.round((sparkSeed / 14) * 100)];

  const timeStr = now
    ? now.toLocaleTimeString("en-US", { hour12: false })
    : "--:--:--";
  const dateStr = now
    ? now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      className={`min-h-screen bg-bg-deep text-slate-200 font-sans selection:bg-kairos-blue/30 flex ${presentation ? "presentation-mode" : ""}`}
    >
      {!presentation && (
        <aside className="w-[72px] flex-none border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-surface">
          <div className="size-10 bg-kairos-blue rounded-lg flex items-center justify-center font-bold text-white tracking-tighter shadow-[0_0_20px_rgba(0,98,255,0.4)]">
            KC
          </div>
          <nav className="flex flex-col gap-4">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setActive(n.key)}
                title={n.label}
                className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                  active === n.key
                    ? "bg-white/5 text-kairos-blue ring-1 ring-kairos-blue/40"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <span className="text-[10px] font-bold tracking-wider">
                  {n.key}
                </span>
              </button>
            ))}
          </nav>
          <div className="mt-auto">
            <div className="size-10 rounded-full border border-white/10 bg-surface-bright grid place-items-center text-[10px] font-bold text-slate-400">
              JD
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-surface/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Kairos Command
              <span className="text-kairos-gold">™</span>
            </h1>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="size-2 bg-green-500 rounded-full pulse-blue" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-green-400">
                Live Ops · {service} Service
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <Link
              to="/presentation"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-kairos-blue/10 hover:bg-kairos-blue/20 border border-kairos-blue/40 text-xs font-semibold text-kairos-blue transition"
            >
              <span className="size-1.5 rounded-full bg-kairos-blue animate-pulse" />
              EXECUTIVE PRESENTATION
            </Link>
            <button
              onClick={() => setPresentation((v) => !v)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-3 lg:px-4 py-2 border border-white/5 transition-all"
            >
              <div className="hidden md:flex flex-col items-end leading-none">
                <span className="text-[10px] text-slate-500 uppercase font-mono">
                  Presentation
                </span>
                <span
                  className={`text-xs font-semibold ${presentation ? "text-kairos-gold" : "text-slate-400"}`}
                >
                  {presentation ? "ENABLED" : "STANDBY"}
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${presentation ? "bg-kairos-gold" : "bg-white/10"}`}
              >
                <div
                  className={`h-4 w-4 bg-white rounded-full transition-transform ${presentation ? "translate-x-5" : ""}`}
                />
              </div>
            </button>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-400 uppercase">
                {dateStr}
              </p>
              <p className="text-lg font-bold tabular-nums leading-none font-mono">
                {timeStr}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 grid grid-cols-12 auto-rows-min lg:grid-rows-6 gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden">
          <KpiCard
            label="Total Parking Capacity"
            value={live.parkingFillPct.toFixed(0)}
            unit="%"
            progress={live.parkingFillPct}
          />
          <KpiCard
            label="Avg Shuttle Cycle"
            value={live.avgShuttleCycleMin.toFixed(1)}
            unit="min"
            spark={spark}
          />
          <KpiCard
            label="Active Personnel"
            value={String(live.activePersonnel)}
            unit={`/${live.totalPersonnel}`}
            personnel
            personnelExtra={Math.max(0, live.activePersonnel - 3)}
          />
          <KpiCard
            label="Security Status"
            value={live.incidentsOpen === 0 ? "NOMINAL" : "ALERT"}
            statusNominal={live.incidentsOpen === 0}
            incidentsOpen={live.incidentsOpen}
          />


          <MapPanel
            service={service}
            onServiceChange={setService}
          />

          <div className="col-span-12 lg:col-span-4 lg:row-span-5 flex flex-col gap-4 lg:gap-6">
            <PersonnelPanel />
            <AlertsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  progress,
  spark,
  personnel,
  personnelExtra,
  statusNominal,
  incidentsOpen,
}: {
  label: string;
  value: string;
  unit?: string;
  progress?: number;
  spark?: number[];
  personnel?: boolean;
  personnelExtra?: number;
  statusNominal?: boolean;
  incidentsOpen?: number;
}) {
  return (
    <div className="col-span-6 lg:col-span-3 bg-surface border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-kairos-blue/30 transition-all fade-in-up">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        {statusNominal ? (
          <h3 className="text-2xl font-bold text-green-400 tracking-tight">
            {value}
          </h3>
        ) : (
          <h3 className="text-3xl font-bold font-mono text-white">
            {value}
            {unit && (
              <span className="text-lg text-slate-500 font-normal ml-0.5">
                {unit}
              </span>
            )}
          </h3>
        )}
      </div>

      {progress !== undefined && (
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-kairos-blue rounded-full shadow-[0_0_10px_rgba(0,98,255,0.4)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {spark && (
        <div className="flex items-end gap-1 h-8 mt-4">
          {spark.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${
                i === spark.length - 1 ? "bg-kairos-blue" : "bg-white/10"
              }`}
              style={{ height: `${v}%` }}
            />
          ))}
        </div>
      )}

      {personnel && (
        <div className="flex -space-x-2 mt-4">
          {["bg-slate-700", "bg-slate-600", "bg-slate-500"].map((c, i) => (
            <div
              key={i}
              className={`size-6 rounded-full border-2 border-surface ${c}`}
            />
          ))}
          <div className="size-6 rounded-full border-2 border-surface bg-kairos-blue flex items-center justify-center text-[9px] font-bold text-white">
            +55
          </div>
        </div>
      )}

      {statusNominal && (
        <div className="text-[10px] font-mono text-slate-500 uppercase mt-4">
          No open incidents recorded
        </div>
      )}
    </div>
  );
}


const PERSONNEL = [
  {
    name: "Marcus Chen",
    role: "Parking Supervisor · Lot A",
    status: "online" as const,
  },
  {
    name: "Sarah Jenkins",
    role: "Shuttle Lead · Route 2",
    status: "online" as const,
  },
  {
    name: "David Ortiz",
    role: "Golf Cart Op · ADA Zone",
    status: "online" as const,
  },
  {
    name: "Robert Vance",
    role: "HPD Liaison · Gate 4",
    status: "offline" as const,
  },
  {
    name: "Angela Brooks",
    role: "First Touch Lead · Main",
    status: "online" as const,
  },
  {
    name: "Terrence Hill",
    role: "Driver · SH-01",
    status: "online" as const,
  },
];

function PersonnelPanel() {
  return (
    <div className="flex-1 bg-surface border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col min-h-[240px]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white">
          Field Personnel
        </h4>
        <span className="text-[10px] font-mono text-slate-500">
          {PERSONNEL.filter((p) => p.status === "offline").length} OFFLINE
        </span>
      </div>
      <div className="space-y-2 overflow-y-auto pr-1">
        {PERSONNEL.map((p) => (
          <div
            key={p.name}
            className={`flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 ${p.status === "offline" ? "border-dashed opacity-60" : ""}`}
          >
            <div className="size-8 rounded-lg bg-surface-bright grid place-items-center text-[10px] font-bold text-slate-400">
              {p.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{p.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate">
                {p.role}
              </p>
            </div>
            <div
              className={`size-2 rounded-full ${p.status === "online" ? "bg-green-500" : "bg-slate-600"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsPanel() {
  return (
    <div className="h-56 bg-surface border border-white/5 rounded-2xl p-5 flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white">
          Alerts & Comms
        </h4>
        <span className="text-[10px] font-mono text-kairos-gold">LIVE</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        <div className="pl-3 border-l-2 border-kairos-gold">
          <p className="text-xs font-bold text-white">Weather Alert</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Potential rain at 12:45 PM. Prep umbrellas for egress.
          </p>
        </div>
        <div className="pl-3 border-l-2 border-kairos-blue">
          <p className="text-xs font-bold text-white">Overflow Activated</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Lot C reaching 95%. Redirecting to TSU North.
          </p>
        </div>
        <div className="pl-3 border-l-2 border-green-500">
          <p className="text-xs font-bold text-white">Shift Change · 10:45</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Second Ops rotation staged and briefed.
          </p>
        </div>
      </div>
    </div>
  );
}
