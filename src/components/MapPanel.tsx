import { useMemo, useRef, useState } from "react";
import aerialAsset from "@/assets/wheeler-aerial.jpg.asset.json";
import streetAsset from "@/assets/wheeler-street.jpg.asset.json";
import lotAsset from "@/assets/wheeler-lot.jpg.asset.json";

type LayerKey =
  | "ingress"
  | "egress"
  | "shuttle"
  | "stops"
  | "loading"
  | "closures"
  | "parking";

type BaseKey = "street" | "aerial" | "lot" | "custom";

const BASES: { key: BaseKey; label: string; src?: string }[] = [
  { key: "street", label: "Street", src: streetAsset.url },
  { key: "aerial", label: "Aerial", src: aerialAsset.url },
  { key: "lot", label: "Lot Plan", src: lotAsset.url },
];

// Coordinates are % of the map viewport (0-100). Tuned against the street map.
const INGRESS: { d: string }[] = [
  // yellow ingress from Cullen Blvd → main lot
  { d: "M 86,72 L 70,72 L 55,70 L 45,68" },
  { d: "M 12,60 L 22,60 L 30,62 L 40,64" },
];

const EGRESS: { d: string }[] = [
  // red egress
  { d: "M 45,68 L 30,72 L 18,80 L 6,86" },
  { d: "M 55,70 L 62,80 L 74,88 L 90,90" },
  { d: "M 40,64 L 42,50 L 44,38 L 42,26" },
];

const SHUTTLE: { d: string }[] = [
  // blue shuttle route: UH Zone F → church main
  { d: "M 32,10 L 30,22 L 34,34 L 40,42 L 48,50" },
  { d: "M 88,32 L 78,40 L 66,46 L 52,50" },
];

const STOPS = [
  { x: 32, y: 10, label: "UH Zone F" },
  { x: 88, y: 32, label: "Lot 11A" },
  { x: 48, y: 50, label: "Main Sanctuary" },
  { x: 30, y: 42, label: "Scott St Stop" },
];

const LOADING = [
  { x: 46, y: 48, w: 6, h: 3, label: "ADA Loading" },
  { x: 52, y: 62, w: 5, h: 3, label: "Pax Loading" },
];

const CLOSURES = [
  { x: 24, y: 34, label: "Wheeler @ Scott" },
  { x: 70, y: 32, label: "Cougar Pl" },
];

const PARKING_LOTS = [
  { x: 30, y: 78, w: 14, h: 12, fill: 84, name: "Main Lot" },
  { x: 50, y: 78, w: 22, h: 14, fill: 62, name: "South Lot" },
  { x: 80, y: 60, w: 12, h: 10, fill: 95, name: "Overflow C" },
  { x: 30, y: 10, w: 22, h: 14, fill: 45, name: "UH Zone F" },
];

const LAYERS: { key: LayerKey; label: string; color: string }[] = [
  { key: "ingress", label: "Ingress (Cars)", color: "#facc15" },
  { key: "egress", label: "Egress (Exit Flow)", color: "#ef4444" },
  { key: "shuttle", label: "Shuttle Routes", color: "#0062ff" },
  { key: "stops", label: "Shuttle Stops", color: "#38bdf8" },
  { key: "loading", label: "Loading Zones", color: "#f97316" },
  { key: "closures", label: "Road Closures", color: "#ef4444" },
  { key: "parking", label: "Parking Occupancy", color: "#22c55e" },
];

type Props = {
  service: "7:00 AM" | "10:00 AM" | "1:00 PM";
  onServiceChange: (s: "7:00 AM" | "10:00 AM" | "1:00 PM") => void;
};

export function MapPanel({ service, onServiceChange }: Props) {
  const [base, setBase] = useState<BaseKey>("street");
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    ingress: true,
    egress: true,
    shuttle: true,
    stops: true,
    loading: false,
    closures: false,
    parking: true,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const bases = useMemo(() => {
    const list = [...BASES];
    if (customUrl) list.push({ key: "custom", label: "Custom", src: customUrl });
    return list;
  }, [customUrl]);

  const activeSrc = bases.find((b) => b.key === base)?.src ?? BASES[0].src;

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCustomUrl(url);
    setBase("custom");
  }

  function toggle(k: LayerKey) {
    setLayers((s) => ({ ...s, [k]: !s[k] }));
  }

  return (
    <div className="col-span-12 lg:col-span-8 lg:row-span-5 bg-surface border border-white/5 rounded-3xl relative overflow-hidden min-h-[520px]">
      {/* Base image */}
      <div className="absolute inset-0">
        <img
          src={activeSrc}
          alt="Wheeler Avenue campus map"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 map-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 via-transparent to-bg-deep/20" />
      </div>

      {/* Overlays */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <marker id="arr-ing" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#facc15" />
          </marker>
          <marker id="arr-egr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
          </marker>
          <marker id="arr-shu" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0062ff" />
          </marker>
        </defs>

        {layers.parking &&
          PARKING_LOTS.map((l) => (
            <g key={l.name}>
              <rect
                x={l.x}
                y={l.y}
                width={l.w}
                height={l.h}
                fill={l.fill > 90 ? "#ef4444" : l.fill > 75 ? "#f59e0b" : "#22c55e"}
                fillOpacity="0.25"
                stroke={l.fill > 90 ? "#ef4444" : l.fill > 75 ? "#f59e0b" : "#22c55e"}
                strokeWidth="0.25"
              />
            </g>
          ))}

        {layers.ingress &&
          INGRESS.map((p, i) => (
            <path
              key={`i${i}`}
              d={p.d}
              stroke="#facc15"
              strokeWidth="0.9"
              fill="none"
              markerEnd="url(#arr-ing)"
              className="flow-dash"
            />
          ))}

        {layers.egress &&
          EGRESS.map((p, i) => (
            <path
              key={`e${i}`}
              d={p.d}
              stroke="#ef4444"
              strokeWidth="0.9"
              fill="none"
              markerEnd="url(#arr-egr)"
              className="flow-dash"
            />
          ))}

        {layers.shuttle &&
          SHUTTLE.map((p, i) => (
            <path
              key={`s${i}`}
              d={p.d}
              stroke="#0062ff"
              strokeWidth="0.7"
              fill="none"
              markerEnd="url(#arr-shu)"
              className="flow-dash"
            />
          ))}
      </svg>

      {/* HTML pins (above SVG) */}
      {layers.stops &&
        STOPS.map((s) => (
          <div
            key={s.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            <div className="size-3 rounded-full bg-sky-400 border-2 border-white shadow-lg pulse-blue" />
            <div className="opacity-0 group-hover:opacity-100 transition absolute left-4 top-0 whitespace-nowrap bg-surface/90 backdrop-blur border border-white/10 rounded px-2 py-1 text-[10px] font-bold text-white">
              {s.label}
            </div>
          </div>
        ))}

      {layers.loading &&
        LOADING.map((l) => (
          <div
            key={l.label}
            className="absolute border-2 border-orange-500 bg-orange-500/20 rounded flex items-center justify-center"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.w}%`,
              height: `${l.h}%`,
            }}
          >
            <span className="text-[8px] font-bold text-orange-300 uppercase tracking-wider">
              {l.label}
            </span>
          </div>
        ))}

      {layers.closures &&
        CLOSURES.map((c) => (
          <div
            key={c.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          >
            <div className="size-6 rounded bg-red-500/90 border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-lg">
              ✕
            </div>
            <span className="text-[9px] font-bold text-red-300 bg-bg-deep/80 px-1.5 py-0.5 rounded whitespace-nowrap">
              {c.label}
            </span>
          </div>
        ))}

      {/* Layer control panel */}
      <div className="absolute top-4 left-4 lg:top-6 lg:left-6 w-64 z-10">
        <div className="bg-surface/85 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Map Layers
            </h4>
            <span className="text-[9px] font-mono text-slate-500">
              {Object.values(layers).filter(Boolean).length}/{LAYERS.length}
            </span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {LAYERS.map((l) => {
              const on = layers[l.key];
              return (
                <button
                  key={l.key}
                  onClick={() => toggle(l.key)}
                  className="w-full flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: l.color, boxShadow: on ? `0 0 8px ${l.color}` : "none" }}
                    />
                    <span className="text-[11px] text-slate-300 group-hover:text-white transition">
                      {l.label}
                    </span>
                  </span>
                  <div
                    className={`w-8 h-4 rounded-full relative transition-colors ${on ? "bg-kairos-blue" : "bg-white/10"}`}
                  >
                    <div
                      className={`absolute top-1 size-2 rounded-full transition-all ${on ? "right-1 bg-white" : "left-1 bg-slate-500"}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 mt-3 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Base Layer
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {bases.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBase(b.key)}
                  className={`text-[10px] font-bold py-1.5 rounded border transition ${
                    base === b.key
                      ? "bg-kairos-blue text-white border-white/10"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 w-full text-[10px] font-bold py-1.5 rounded border border-dashed border-white/15 text-kairos-gold hover:bg-white/5 transition"
            >
              + Upload Aerial Imagery
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onUpload}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-surface/85 backdrop-blur-xl border border-white/10 rounded-xl p-3 z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-2">
          Legend
        </p>
        <div className="space-y-1">
          {LAYERS.filter((l) => layers[l.key]).map((l) => (
            <div key={l.key} className="flex items-center gap-2">
              <span className="w-4 h-0.5" style={{ background: l.color }} />
              <span className="text-[10px] text-slate-300">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Service selector */}
      <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 flex gap-2 z-10">
        {(["7:00 AM", "10:00 AM", "1:00 PM"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onServiceChange(s)}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${
              service === s
                ? "bg-kairos-blue text-white border-white/10 shadow-[0_0_20px_rgba(0,98,255,0.35)]"
                : "bg-surface/80 backdrop-blur-md border-white/10 hover:bg-white/5 text-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Site label */}
      <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 z-10 bg-surface/85 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2">
        <p className="text-[9px] font-mono text-slate-500 uppercase">Site</p>
        <p className="text-xs font-bold text-white">Wheeler Ave Baptist Church</p>
      </div>
    </div>
  );
}
