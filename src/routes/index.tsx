import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useLiveOps } from "@/hooks/use-live-ops";
import { MapPanel } from "@/components/MapPanel";
import trafficFlowPlan from "@/assets/wheeler-traffic-flow-plan.png.asset.json";
import { listDocuments, uploadDocument, deleteDocument } from "@/lib/documents.functions";
import { ensureDeviceCode, getDeviceCode } from "@/lib/device-access";
import { ParkingLotsPanel, useParkingState, countDate, toDateKey } from "@/lib/parking-lots";


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

type NavKey = "DASH" | "MAP" | "OPS" | "FLEET" | "LOTS" | "COMM" | "DOCS" | "KPI";

const NAV: { key: NavKey; label: string }[] = [
  { key: "DASH", label: "Dashboard" },
  { key: "MAP", label: "Maps" },
  { key: "OPS", label: "Ops" },
  { key: "FLEET", label: "Fleet" },
  { key: "LOTS", label: "Parking Lots" },
  { key: "COMM", label: "Comms" },
  { key: "DOCS", label: "Documents" },
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
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition"
            >
              ADMIN
            </Link>
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

        {active === "DOCS" ? (
          <DocumentsPanel />
        ) : active === "LOTS" ? (
          <ParkingLotsPanel />
        ) : (

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
        )}
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
            +{personnelExtra ?? 55}
          </div>
        </div>
      )}

      {statusNominal !== undefined && (
        <div className="text-[10px] font-mono text-slate-500 uppercase mt-4">
          {incidentsOpen && incidentsOpen > 0
            ? `${incidentsOpen} open incident${incidentsOpen === 1 ? "" : "s"}`
            : "No open incidents recorded"}
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

type DocItem = {
  id: string;
  title: string;
  meta: string;
  description: string;
  src: string;
  kind: "image" | "file";
  uploaded?: boolean;
  storagePath?: string;
};

const DOCUMENTS: DocItem[] = [
  {
    id: "wheeler-traffic-flow-plan",
    title: "Wheeler Avenue \u2014 Parking Lot Traffic Flow Plan",
    meta: "Site plan \u00b7 Tracts 1, 4 & 11 \u00b7 618 spaces",
    description:
      "Directional flow per row, traffic dividing lines, wheel stops, and signage placement for the back gate (no exit) and front gate (no entry).",
    src: trafficFlowPlan.url,
    kind: "image",
  },
];

function DocumentsPanel() {
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [uploads, setUploads] = useState<DocItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(true);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);

  const loadCloud = async (code: string) => {
    try {
      const { rows } = await listDocuments({ data: { code } });
      setUploads(
        rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          meta: r.meta ?? "Uploaded document",
          description: r.description ?? "Uploaded reference document.",
          src: r.url,
          kind: String(r.contentType ?? "").startsWith("image/") ? "image" : "file",
          uploaded: true,
          storagePath: r.storagePath,
        })),
      );
      setError(null);
    } catch (e) {
      setUploads([]);
      setError(
        (e as Error).message?.includes("not invited")
          ? "This device is not invited — enter an access code to view uploaded documents."
          : "Could not load uploaded documents.",
      );
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const stored = getDeviceCode();
    if (!stored) {
      setSyncing(false);
      setError("This device is not invited — enter an access code to view uploaded documents.");
      return;
    }
    setDeviceCode(stored);
    void loadCloud(stored);
  }, []);

  const unlock = async () => {
    const code = await ensureDeviceCode({ force: !getDeviceCode() });
    if (!code) return;
    setDeviceCode(code);
    setSyncing(true);
    await loadCloud(code);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (!deviceCode) {
      setError("Enter this device's access code before uploading documents.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      for (const file of files) {
        if (file.size > 12 * 1024 * 1024) {
          setError(`${file.name} is larger than 12 MB and was skipped.`);
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        await uploadDocument({
          data: {
            code: deviceCode,
            name: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            base64,
          },
        });
      }
      await loadCloud(deviceCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeDoc = async (doc: DocItem) => {
    if (!deviceCode) {
      setError("Enter this device's access code before deleting documents.");
      return;
    }
    try {
      await deleteDocument({ data: { code: deviceCode, id: doc.id } });
      setUploads((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  const allDocs = [...DOCUMENTS, ...uploads];

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Documents
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">
            {syncing
              ? "Checking device invite\u2026"
              : deviceCode
                ? `Device invited \u2713 ${deviceCode}`
                : "Device not invited \u00b7 uploads hidden"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void unlock()}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition"
          >
            {deviceCode ? "Change code" : "Enter code"}
          </button>
          {deviceCode && (
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-kairos-blue/15 border border-kairos-blue/40 text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/25 transition">
              {busy ? "Uploading\u2026" : "Upload Document"}
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const input = e.currentTarget;
                  const picked = input.files ? Array.from(input.files) : [];
                  input.value = "";
                  void handleFiles(picked);
                }}
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 text-[11px] text-kairos-gold font-mono">{error}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {allDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-kairos-blue/30 transition-all"
          >
            {doc.kind === "image" ? (
              <button
                onClick={() => setOpenDoc(doc.src)}
                className="bg-white/95 p-2 group"
                title="Open full size"
              >
                <img
                  src={doc.src}
                  alt={doc.title}
                  loading="lazy"
                  className="w-full rounded-lg group-hover:opacity-90 transition"
                />
              </button>
            ) : (
              <a
                href={doc.src}
                target="_blank"
                rel="noreferrer"
                className="h-40 grid place-items-center bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-kairos-blue transition"
              >
                Open file
              </a>
            )}
            <div className="p-5 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-white">{doc.title}</h3>
              <p className="text-[10px] font-mono uppercase tracking-widest text-kairos-gold">
                {doc.meta}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {doc.description}
              </p>
              <div className="flex gap-2 mt-2">
                {doc.kind === "image" && (
                  <button
                    onClick={() => setOpenDoc(doc.src)}
                    className="px-3 py-2 rounded-lg bg-kairos-blue/10 border border-kairos-blue/40 text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/20 transition"
                  >
                    View
                  </button>
                )}
                <a
                  href={doc.src}
                  download={doc.title}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10 transition"
                >
                  Download
                </a>
                {doc.uploaded && (
                  <button
                    onClick={() => void removeDoc(doc)}
                    className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {openDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 lg:p-10 overflow-auto"
          onClick={() => setOpenDoc(null)}
        >
          <button
            onClick={() => setOpenDoc(null)}
            className="fixed top-5 right-6 z-10 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white"
          >
            Close
          </button>
          <img
            src={openDoc}
            alt="Document full size"
            className="mx-auto min-w-[900px] max-w-none w-full rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
