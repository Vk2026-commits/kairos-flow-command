import { useEffect, useMemo, useRef, useState } from "react";
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

type Tool = "ingress" | "egress" | "shuttle" | "closure" | null;

type Pt = { x: number; y: number };
type Annotation =
  | { id: string; kind: "ingress" | "egress" | "shuttle"; base: BaseKey; points: Pt[]; label?: string }
  | { id: string; kind: "closure"; base: BaseKey; point: Pt; label: string };

const BASES: { key: BaseKey; label: string; src?: string }[] = [
  { key: "street", label: "Street", src: streetAsset.url },
  { key: "aerial", label: "Aerial", src: aerialAsset.url },
  { key: "lot", label: "Lot Plan", src: lotAsset.url },
];

const STOPS = [
  { x: 48, y: 50, label: "Main Sanctuary" },
];

const LOADING = [
  { x: 46, y: 48, w: 6, h: 3, label: "ADA Loading" },
  { x: 52, y: 62, w: 5, h: 3, label: "Pax Loading" },
];

const PARKING_LOTS = [
  { x: 30, y: 78, w: 14, h: 12, fill: 84, name: "Main Lot" },
  { x: 50, y: 78, w: 22, h: 14, fill: 62, name: "South Lot" },
  { x: 80, y: 60, w: 12, h: 10, fill: 95, name: "Overflow C" },
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

const TOOL_COLORS: Record<Exclude<Tool, null>, string> = {
  ingress: "#facc15",
  egress: "#ef4444",
  shuttle: "#0062ff",
  closure: "#ef4444",
};

const STORAGE_KEY = "kairos:annotations:v1";

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
    closures: true,
    parking: true,
  });

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<Tool>(null);
  const [draft, setDraft] = useState<Pt[]>([]);
  const [cursor, setCursor] = useState<Pt | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // Load / persist annotations
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnnotations(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
    } catch {
      /* ignore */
    }
  }, [annotations]);

  const bases = useMemo(() => {
    const list = [...BASES];
    if (customUrl) list.push({ key: "custom", label: "Custom", src: customUrl });
    return list;
  }, [customUrl]);
  const activeSrc = bases.find((b) => b.key === base)?.src ?? BASES[0].src;

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCustomUrl(URL.createObjectURL(f));
    setBase("custom");
  }

  function toggle(k: LayerKey) {
    setLayers((s) => ({ ...s, [k]: !s[k] }));
  }

  function ptFromEvent(e: React.MouseEvent): Pt | null {
    const el = surfaceRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  }

  function onSurfaceClick(e: React.MouseEvent) {
    if (!tool) return;
    const p = ptFromEvent(e);
    if (!p) return;
    if (tool === "closure") {
      const label = window.prompt("Closure label:", "Road Closed") ?? "";
      if (!label) return;
      setAnnotations((a) => [
        ...a,
        { id: crypto.randomUUID(), kind: "closure", base, point: p, label },
      ]);
      return;
    }
    setDraft((d) => [...d, p]);
  }

  function onSurfaceMove(e: React.MouseEvent) {
    if (!tool || tool === "closure") return;
    setCursor(ptFromEvent(e));
  }

  function finishPath() {
    if (!tool || tool === "closure" || draft.length < 2) {
      setDraft([]);
      return;
    }
    const label = window.prompt(`${tool.toUpperCase()} label (optional):`, "") ?? "";
    setAnnotations((a) => [
      ...a,
      {
        id: crypto.randomUUID(),
        kind: tool as "ingress" | "egress" | "shuttle",
        base,
        points: [...draft],
        label: label || undefined,
      },
    ]);
    setDraft([]);
  }

  function cancelDraft() {
    setDraft([]);
    setTool(null);
    setCursor(null);
  }

  function undo() {
    if (draft.length) {
      setDraft((d) => d.slice(0, -1));
      return;
    }
    setAnnotations((a) => a.slice(0, -1));
  }

  function clearAll() {
    if (!window.confirm("Delete ALL annotations on every base layer?")) return;
    setAnnotations([]);
  }

  function exportAnnotations() {
    const payload = {
      app: "kairos-command",
      kind: "map-annotations",
      version: 1,
      exportedAt: new Date().toISOString(),
      annotations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `kairos-annotations-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const importRef = useRef<HTMLInputElement>(null);

  function isValidAnnotation(a: unknown): a is Annotation {
    if (!a || typeof a !== "object") return false;
    const r = a as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.base !== "string") return false;
    if (r.kind === "closure") {
      const p = r.point as Pt | undefined;
      return (
        typeof r.label === "string" &&
        !!p &&
        typeof p.x === "number" &&
        typeof p.y === "number"
      );
    }
    if (r.kind === "ingress" || r.kind === "egress" || r.kind === "shuttle") {
      return (
        Array.isArray(r.points) &&
        (r.points as Pt[]).every(
          (p) => typeof p?.x === "number" && typeof p?.y === "number",
        )
      );
    }
    return false;
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const list: unknown = Array.isArray(parsed)
        ? parsed
        : parsed?.annotations;
      if (!Array.isArray(list)) throw new Error("No annotations array found.");
      const clean = list.filter(isValidAnnotation) as Annotation[];
      if (!clean.length) throw new Error("File contained no valid annotations.");

      const replace = window.confirm(
        `Import ${clean.length} annotation(s).\n\nOK = REPLACE current annotations\nCancel = MERGE with current annotations`,
      );
      // Regenerate ids on merge to avoid collisions with existing entries.
      const withIds = clean.map((a) => ({ ...a, id: crypto.randomUUID() }));
      setAnnotations((prev) => (replace ? withIds : [...prev, ...withIds]));
    } catch (err) {
      window.alert(
        `Import failed: ${err instanceof Error ? err.message : "invalid file"}`,
      );
    }
  }


  // Show annotations that belong to the currently selected base layer,
  // and only when the matching layer toggle is on.
  const visibleAnnotations = annotations.filter((a) => {
    if (a.base !== base) return false;
    if (a.kind === "closure") return layers.closures;
    return layers[a.kind];
  });

  function pathD(pts: Pt[]) {
    if (!pts.length) return "";
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  }

  return (
    <div className="col-span-12 lg:col-span-8 lg:row-span-5 bg-surface border border-white/5 rounded-3xl relative overflow-hidden min-h-[520px]">
      {/* Base image + click surface */}
      <div
        ref={surfaceRef}
        onClick={onSurfaceClick}
        onMouseMove={onSurfaceMove}
        onDoubleClick={finishPath}
        className={`absolute inset-0 ${tool ? "cursor-crosshair" : ""}`}
      >
        <img
          src={activeSrc}
          alt="Wheeler Avenue campus map"
          className="w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 map-grid opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 via-transparent to-bg-deep/20 pointer-events-none" />

        {/* Overlay SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {(["ingress", "egress", "shuttle"] as const).map((k) => (
              <marker
                key={k}
                id={`arr-${k}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={TOOL_COLORS[k]} />
              </marker>
            ))}
          </defs>

          {layers.parking &&
            PARKING_LOTS.map((l) => (
              <rect
                key={l.name}
                x={l.x}
                y={l.y}
                width={l.w}
                height={l.h}
                fill={l.fill > 90 ? "#ef4444" : l.fill > 75 ? "#f59e0b" : "#22c55e"}
                fillOpacity="0.25"
                stroke={l.fill > 90 ? "#ef4444" : l.fill > 75 ? "#f59e0b" : "#22c55e"}
                strokeWidth="0.25"
              />
            ))}

          {/* Saved annotations */}
          {visibleAnnotations.map((a) => {
            if (a.kind === "closure") return null;
            return (
              <path
                key={a.id}
                d={pathD(a.points)}
                stroke={TOOL_COLORS[a.kind]}
                strokeWidth="0.9"
                fill="none"
                markerEnd={`url(#arr-${a.kind})`}
                className="flow-dash"
              />
            );
          })}

          {/* Draft */}
          {tool && tool !== "closure" && draft.length > 0 && (
            <>
              <path
                d={pathD(cursor ? [...draft, cursor] : draft)}
                stroke={TOOL_COLORS[tool]}
                strokeWidth="0.9"
                fill="none"
                strokeDasharray="1.5 1.5"
                opacity="0.9"
              />
              {draft.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={TOOL_COLORS[tool]} />
              ))}
            </>
          )}
        </svg>

        {/* Closure pins (annotations + HTML) */}
        {visibleAnnotations.map((a) =>
          a.kind === "closure" ? (
            <div
              key={a.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
              style={{ left: `${a.point.x}%`, top: `${a.point.y}%` }}
            >
              <div className="size-6 rounded bg-red-500/90 border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-lg">
                ✕
              </div>
              <span className="text-[9px] font-bold text-red-300 bg-bg-deep/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                {a.label}
              </span>
            </div>
          ) : a.label ? (
            <div
              key={`lbl-${a.id}`}
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
              style={{
                left: `${a.points[a.points.length - 1].x}%`,
                top: `${a.points[a.points.length - 1].y}%`,
              }}
            >
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-bg-deep/80 border border-white/10"
                style={{ color: TOOL_COLORS[a.kind] }}
              >
                {a.label}
              </span>
            </div>
          ) : null,
        )}

        {layers.stops &&
          STOPS.map((s) => (
            <div
              key={s.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              <div className="size-3 rounded-full bg-sky-400 border-2 border-white shadow-lg pulse-blue" />
            </div>
          ))}

        {layers.loading &&
          LOADING.map((l) => (
            <div
              key={l.label}
              className="absolute border-2 border-orange-500 bg-orange-500/20 rounded flex items-center justify-center pointer-events-none"
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
      </div>

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
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${on ? "bg-kairos-blue" : "bg-white/10"}`}>
                    <div className={`absolute top-1 size-2 rounded-full transition-all ${on ? "right-1 bg-white" : "left-1 bg-slate-500"}`} />
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
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
          </div>
        </div>
      </div>

      {/* Annotation toolbar */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 w-64 z-10">
        <div className="bg-surface/85 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Annotate
            </h4>
            <span className="text-[9px] font-mono text-kairos-gold">
              {annotations.filter((a) => a.base === base).length} on {base}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { k: "ingress", label: "Ingress →" },
                { k: "egress", label: "Egress →" },
                { k: "shuttle", label: "Shuttle →" },
                { k: "closure", label: "✕ Closure" },
              ] as const
            ).map((t) => {
              const on = tool === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => {
                    setDraft([]);
                    setTool(on ? null : t.k);
                  }}
                  className={`text-[10px] font-bold py-2 rounded border transition ${
                    on
                      ? "text-white border-white/20"
                      : "bg-white/5 text-slate-300 border-white/5 hover:text-white"
                  }`}
                  style={on ? { background: TOOL_COLORS[t.k] } : undefined}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {tool && tool !== "closure" && (
            <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
              Click the map to drop points ({draft.length} placed). <b className="text-white">Double-click</b> or press <b className="text-white">Finish</b> to save. Esc to cancel.
            </div>
          )}
          {tool === "closure" && (
            <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
              Click a point on the map to drop a closure marker. You'll be asked for a label.
            </div>
          )}

          <div className="mt-3 flex gap-1.5">
            <button
              onClick={finishPath}
              disabled={!tool || tool === "closure" || draft.length < 2}
              className="flex-1 text-[10px] font-bold py-1.5 rounded bg-kairos-blue text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Finish
            </button>
            <button
              onClick={undo}
              className="flex-1 text-[10px] font-bold py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/5"
            >
              Undo
            </button>
            <button
              onClick={cancelDraft}
              className="flex-1 text-[10px] font-bold py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/5"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={clearAll}
            className="mt-1.5 w-full text-[10px] font-bold py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
          >
            Clear All Annotations
          </button>
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
