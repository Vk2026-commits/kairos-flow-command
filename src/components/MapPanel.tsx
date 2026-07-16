import { useEffect, useMemo, useRef, useState } from "react";
import aerialAsset from "@/assets/wheeler-aerial.jpg.asset.json";
import streetAsset from "@/assets/wheeler-street.jpg.asset.json";
import lotAsset from "@/assets/wheeler-lot.jpg.asset.json";
import { LiveMap, type LiveMapHandle, type LiveMapView } from "./LiveMap";

type LayerKey =
  | "ingress"
  | "egress"
  | "shuttle"
  | "stops"
  | "loading"
  | "closures"
  | "parking";

type BaseKey = "street" | "aerial" | "lot" | "live" | "custom";
type LiveMapType = "roadmap" | "satellite" | "hybrid";

type Tool = "ingress" | "egress" | "shuttle" | "closure" | null;
type ImportMode = "merge" | "replace";

type Pt = { x: number; y: number };
type Annotation =
  | { id: string; kind: "ingress" | "egress" | "shuttle"; base: BaseKey; points: Pt[]; label?: string }
  | { id: string; kind: "closure"; base: BaseKey; point: Pt; label: string };

const BASES: { key: BaseKey; label: string; src?: string }[] = [
  { key: "street", label: "Street", src: streetAsset.url },
  { key: "aerial", label: "Aerial", src: aerialAsset.url },
  { key: "lot", label: "Lot Plan", src: lotAsset.url },
  { key: "live", label: "Live Map" },
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

  // Live Google Maps view state
  const [liveMapType, setLiveMapType] = useState<LiveMapType>("hybrid");
  const [streetView, setStreetView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMsg, setSearchMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [searching, setSearching] = useState(false);
  type RecentSearch = { query: string; address: string; at: number; pinned?: boolean };
  const RECENT_KEY = "kairos:recent-searches:v1";
  const RECENT_CAP = 10;
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [recentOpen, setRecentOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {
      /* ignore */
    }
  }, [recent]);

  function sortRecent(list: RecentSearch[]) {
    return [...list].sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.at - a.at;
    });
  }

  function togglePin(entry: RecentSearch) {
    setRecent((prev) =>
      sortRecent(
        prev.map((p) =>
          p.at === entry.at && p.address === entry.address ? { ...p, pinned: !p.pinned } : p,
        ),
      ),
    );
  }

  async function runSearch(q: string) {
    if (!liveMapRef.current || !q.trim()) return;
    setSearching(true);
    setSearchMsg(null);
    setRecentOpen(false);
    const r = await liveMapRef.current.search(q);
    setSearching(false);
    if (r.ok) {
      setSearchMsg({ tone: "ok", text: r.address });
      setRecent((prev) => {
        const existing = prev.find(
          (p) => p.address === r.address || p.query.toLowerCase() === q.trim().toLowerCase(),
        );
        const entry: RecentSearch = {
          query: q.trim(),
          address: r.address,
          at: Date.now(),
          pinned: existing?.pinned,
        };
        const rest = prev.filter(
          (p) => p.address !== r.address && p.query.toLowerCase() !== q.trim().toLowerCase(),
        );
        // Cap only unpinned; pinned entries never get evicted.
        const pinned = rest.filter((p) => p.pinned);
        const unpinned = rest.filter((p) => !p.pinned);
        const nextUnpinned = entry.pinned
          ? unpinned
          : [entry, ...unpinned].slice(0, RECENT_CAP);
        const nextPinned = entry.pinned ? [entry, ...pinned] : pinned;
        return sortRecent([...nextPinned, ...nextUnpinned]);
      });
    } else {
      setSearchMsg({ tone: "err", text: r.error });
    }
  }

  async function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(searchQuery);
  }

  const filteredRecent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = sortRecent(recent);
    if (!q) return sorted;
    return sorted.filter(
      (r) => r.query.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
    );
  }, [recent, searchQuery]);

  // Named landmarks — saved from recent searches for reuse during annotate/playback.
  type Landmark = { id: string; label: string; query: string; address: string; at: number };
  const LANDMARKS_KEY = "kairos:landmarks:v1";
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LANDMARKS_KEY);
      if (raw) setLandmarks(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LANDMARKS_KEY, JSON.stringify(landmarks));
    } catch {
      /* ignore */
    }
  }, [landmarks]);

  function saveAsLandmark(source: { query: string; address: string }) {
    const suggested = source.address.split(",")[0] ?? source.query;
    const label = window.prompt("Landmark label:", suggested)?.trim();
    if (!label) return;
    setLandmarks((prev) => {
      const filtered = prev.filter(
        (l) => l.label.toLowerCase() !== label.toLowerCase() && l.address !== source.address,
      );
      return [
        { id: crypto.randomUUID(), label, query: source.query, address: source.address, at: Date.now() },
        ...filtered,
      ];
    });
    setRecentOpen(false);
  }

  function renameLandmark(id: string) {
    const cur = landmarks.find((l) => l.id === id);
    if (!cur) return;
    const label = window.prompt("Rename landmark:", cur.label)?.trim();
    if (!label) return;
    setLandmarks((prev) => prev.map((l) => (l.id === id ? { ...l, label } : l)));
  }

  function removeLandmark(id: string) {
    setLandmarks((prev) => prev.filter((l) => l.id !== id));
  }

  const landmarksImportRef = useRef<HTMLInputElement>(null);

  function exportLandmarks() {
    if (!landmarks.length) return;
    const payload = {
      app: "kairos-command",
      kind: "map-landmarks",
      version: 1,
      exportedAt: new Date().toISOString(),
      landmarks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `kairos-landmarks-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function isValidLandmark(l: unknown): l is Landmark {
    if (!l || typeof l !== "object") return false;
    const r = l as Record<string, unknown>;
    return (
      typeof r.label === "string" &&
      typeof r.query === "string" &&
      typeof r.address === "string"
    );
  }

  async function onImportLandmarks(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const list: unknown = Array.isArray(parsed) ? parsed : parsed?.landmarks;
      if (!Array.isArray(list)) throw new Error("No landmarks array found.");
      const clean = list.filter(isValidLandmark) as Landmark[];
      if (!clean.length) throw new Error("File contained no valid landmarks.");
      const mode = window.confirm(
        `Import ${clean.length} landmark(s)?\n\nOK = Merge with existing (skip duplicates)\nCancel = Replace all current landmarks`,
      )
        ? "merge"
        : "replace";
      setLandmarks((prev) => {
        const incoming = clean.map((l) => ({
          id: crypto.randomUUID(),
          label: l.label,
          query: l.query,
          address: l.address,
          at: typeof l.at === "number" ? l.at : Date.now(),
        }));
        if (mode === "replace") return incoming;
        const seen = new Set(
          prev.map((p) => `${p.label.toLowerCase()}::${p.address.toLowerCase()}`),
        );
        const deduped = incoming.filter(
          (l) => !seen.has(`${l.label.toLowerCase()}::${l.address.toLowerCase()}`),
        );
        return [...deduped, ...prev];
      });
      setRecentOpen(true);
    } catch (err) {
      window.alert(
        `Import failed: ${err instanceof Error ? err.message : "invalid file"}`,
      );
    }
  }


  // Traffic Plans — save the whole map state (annotations + base + layers + live view)
  // as a named plan so operators can pull it up for any traffic scenario.
  type TrafficPlan = {
    id: string;
    name: string;
    savedAt: number;
    base: BaseKey;
    layers: Record<LayerKey, boolean>;
    annotations: Annotation[];
    liveView?: LiveMapView | null;
    liveMapType?: LiveMapType;
    streetView?: boolean;
    service?: Props["service"];
  };
  const PLANS_KEY = "kairos:traffic-plans:v1";
  const [plans, setPlans] = useState<TrafficPlan[]>([]);
  const [plansOpen, setPlansOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLANS_KEY);
      if (raw) setPlans(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    } catch {
      /* ignore */
    }
  }, [plans]);

  function savePlan() {
    const suggested = `${service} · ${base} · ${new Date().toLocaleDateString()}`;
    const name = window.prompt("Traffic plan name:", suggested)?.trim();
    if (!name) return;
    const liveView = base === "live" ? liveMapRef.current?.getView() ?? null : null;
    const plan: TrafficPlan = {
      id: crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      base,
      layers: { ...layers },
      annotations: annotations.map((a) => ({ ...a })),
      liveView,
      liveMapType,
      streetView,
      service,
    };
    setPlans((prev) => [plan, ...prev.filter((p) => p.name.toLowerCase() !== name.toLowerCase())]);
    setPlansOpen(true);
  }

  function loadPlan(id: string) {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    const replace =
      annotations.length === 0 ||
      window.confirm(
        `Load "${plan.name}"?\n\nOK = Replace current annotations\nCancel = Merge into current annotations`,
      );
    setBase(plan.base);
    setLayers(plan.layers);
    const incoming = plan.annotations.map((a) => ({ ...a, id: crypto.randomUUID() }));
    setAnnotations((prev) => (replace ? incoming : [...prev, ...incoming]));
    if (plan.liveMapType) setLiveMapType(plan.liveMapType);
    if (typeof plan.streetView === "boolean") setStreetView(plan.streetView);
    if (plan.service) onServiceChange(plan.service);
    if (plan.base === "live" && plan.liveView) {
      // Defer until LiveMap mounts / becomes visible.
      window.setTimeout(() => liveMapRef.current?.setView(plan.liveView!), 300);
    }
    setPlansOpen(true);
  }

  function renamePlan(id: string) {
    const cur = plans.find((p) => p.id === id);
    if (!cur) return;
    const name = window.prompt("Rename plan:", cur.name)?.trim();
    if (!name) return;
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  function deletePlan(id: string) {
    const cur = plans.find((p) => p.id === id);
    if (!cur) return;
    if (!window.confirm(`Delete plan "${cur.name}"?`)) return;
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }



  const [mapLocked, setMapLocked] = useState(false);
  useEffect(() => {
    if (base !== "live") return;
    liveMapRef.current?.setInteractive(!mapLocked);
  }, [mapLocked, base, streetView]);


  // Panel visibility — collapse to get panels out of the way while drawing.
  const [layersOpen, setLayersOpen] = useState(true);
  const [annotateOpen, setAnnotateOpen] = useState(true);
  const [playbackOpen, setPlaybackOpen] = useState(true);

  // Panel drag offsets (pixels from their default anchor).
  const [layersOff, setLayersOff] = useState({ x: 0, y: 0 });
  const [annotateOff, setAnnotateOff] = useState({ x: 0, y: 0 });
  const [playbackOff, setPlaybackOff] = useState({ x: 0, y: 0 });

  // Fullscreen (presentation) mode — map fills the viewport.
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  function collapsePanel(setOpen: (v: boolean) => void, setOff: (p: { x: number; y: number }) => void) {
    setOff({ x: 0, y: 0 }); // snap chip back inside the map
    setOpen(false);
  }

  function makeDragHandlers(
    off: { x: number; y: number },
    setOff: (p: { x: number; y: number }) => void,
  ) {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        e.stopPropagation();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        const start = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
        (el as HTMLElement & { __drag?: typeof start }).__drag = start;
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const el = e.currentTarget as HTMLElement & {
          __drag?: { x: number; y: number; ox: number; oy: number };
        };
        if (!el.__drag) return;
        let nx = el.__drag.ox + e.clientX - el.__drag.x;
        let ny = el.__drag.oy + e.clientY - el.__drag.y;
        // Clamp so the dragged panel stays inside the map surface.
        const surface = surfaceRef.current?.getBoundingClientRect();
        // Find the panel wrapper (nearest positioned ancestor with a translate transform).
        const panel = el.closest<HTMLElement>("[data-drag-panel]");
        if (surface && panel) {
          const pr = panel.getBoundingClientRect();
          // Current panel top-left in viewport coords when offset applied:
          const curLeft = pr.left;
          const curTop = pr.top;
          // Convert requested delta into new absolute pos, then clamp.
          const deltaX = nx - el.__drag.ox;
          const deltaY = ny - el.__drag.oy;
          const newLeft = curLeft + (deltaX - (off.x - el.__drag.ox));
          const newTop = curTop + (deltaY - (off.y - el.__drag.oy));
          const minLeft = surface.left + 4;
          const maxLeft = surface.right - pr.width - 4;
          const minTop = surface.top + 4;
          const maxTop = surface.bottom - pr.height - 4;
          if (newLeft < minLeft) nx += minLeft - newLeft;
          if (newLeft > maxLeft) nx -= newLeft - maxLeft;
          if (newTop < minTop) ny += minTop - newTop;
          if (newTop > maxTop) ny -= newTop - maxTop;
        }
        setOff({ x: nx, y: ny });
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        const el = e.currentTarget as HTMLElement & { __drag?: unknown };
        el.__drag = undefined;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      },
    };
  }


  // Playback state — animates ingress/egress/shuttle arrows in saved order.
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  // progress is measured in "arrows": integer part = fully drawn count,
  // fractional part = reveal progress of the current arrow.
  const [progress, setProgress] = useState(0);
  const [pendingImport, setPendingImport] = useState<{
    annotations: Annotation[];
    selectedBases: Record<BaseKey, boolean>;
    mode: ImportMode;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const liveMapRef = useRef<LiveMapHandle>(null);

  // Zoom & pan for image bases (street/aerial/lot/custom).
  const [imgZoom, setImgZoom] = useState(1);
  const [imgPan, setImgPan] = useState({ x: 0, y: 0 });
  const panDrag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  function zoomIn() {
    if (base === "live") liveMapRef.current?.zoomIn();
    else setImgZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)));
  }
  function zoomOut() {
    if (base === "live") liveMapRef.current?.zoomOut();
    else
      setImgZoom((z) => {
        const nz = Math.max(1, +(z - 0.25).toFixed(2));
        if (nz === 1) setImgPan({ x: 0, y: 0 });
        return nz;
      });
  }
  function resetView() {
    if (base === "live") liveMapRef.current?.reset();
    else {
      setImgZoom(1);
      setImgPan({ x: 0, y: 0 });
    }
  }
  useEffect(() => {
    // Reset image zoom/pan whenever the base layer changes.
    setImgZoom(1);
    setImgPan({ x: 0, y: 0 });
  }, [base]);


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

  function selectBase(nextBase: BaseKey) {
    setBase(nextBase);
    setTool(null);
    setDraft([]);
    setCursor(null);
    setPlaying(false);
    setProgress(0);
  }

  const contentRef = useRef<HTMLDivElement>(null);

  function ptFromEvent(e: React.MouseEvent): Pt | null {
    const el = contentRef.current ?? surfaceRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  }

  // Pan-drag when zoomed and no drawing tool active.
  function onSurfacePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (tool || base === "live" || imgZoom <= 1) return;
    const surf = surfaceRef.current;
    if (!surf) return;
    panDrag.current = { x: e.clientX, y: e.clientY, ox: imgPan.x, oy: imgPan.y };
    surf.setPointerCapture(e.pointerId);
  }
  function onSurfacePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!panDrag.current) return;
    const surf = surfaceRef.current;
    if (!surf) return;
    const r = surf.getBoundingClientRect();
    const dx = ((e.clientX - panDrag.current.x) / r.width) * 100;
    const dy = ((e.clientY - panDrag.current.y) / r.height) * 100;
    // Limit pan so scaled content stays over the map.
    const maxPan = ((imgZoom - 1) / imgZoom) * 50;
    const nx = Math.max(-maxPan, Math.min(maxPan, panDrag.current.ox + dx));
    const ny = Math.max(-maxPan, Math.min(maxPan, panDrag.current.oy + dy));
    setImgPan({ x: nx, y: ny });
  }
  function onSurfacePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    panDrag.current = null;
    try {
      surfaceRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
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
    if (
      typeof r.id !== "string" ||
      !(["street", "aerial", "lot", "custom"] as string[]).includes(String(r.base))
    ) {
      return false;
    }
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
      setPendingImport({
        annotations: clean,
        selectedBases: {
          street: clean.some((a) => a.base === "street"),
          aerial: clean.some((a) => a.base === "aerial"),
          lot: clean.some((a) => a.base === "lot"),
          live: clean.some((a) => a.base === "live"),
          custom: clean.some((a) => a.base === "custom"),
        },
        mode: "merge",
      });
    } catch (err) {
      window.alert(
        `Import failed: ${err instanceof Error ? err.message : "invalid file"}`,
      );
    }
  }

  function setImportBase(baseKey: BaseKey, selected: boolean) {
    setPendingImport((current) =>
      current
        ? {
            ...current,
            selectedBases: { ...current.selectedBases, [baseKey]: selected },
          }
        : current,
    );
  }

  function commitImport() {
    if (!pendingImport) return;
    const selected = pendingImport.annotations.filter(
      (a) => pendingImport.selectedBases[a.base],
    );
    if (!selected.length) return;
    const withIds = selected.map((a) => ({ ...a, id: crypto.randomUUID() }));
    setAnnotations((prev) => {
      if (pendingImport.mode === "replace") {
        const selectedBases = new Set(selected.map((a) => a.base));
        return [...prev.filter((a) => !selectedBases.has(a.base)), ...withIds];
      }
      return [...prev, ...withIds];
    });
    setPendingImport(null);
  }


  // Show annotations that belong to the currently selected base layer,
  // and only when the matching layer toggle is on.
  const visibleAnnotations = annotations.filter((a) => {
    if (a.base !== base) return false;
    if (a.kind === "closure") return layers.closures;
    return layers[a.kind];
  });

  // Playback sequence: only path-based arrows on the current base layer,
  // in the order they were saved (ingress → egress → shuttle by save order).
  const playbackSeq = annotations.filter(
    (a): a is Extract<Annotation, { kind: "ingress" | "egress" | "shuttle" }> =>
      a.base === base && a.kind !== "closure",
  );

  // Stop playing if the sequence becomes empty (e.g. layer switched).
  useEffect(() => {
    if (playing && playbackSeq.length === 0) setPlaying(false);
  }, [playing, playbackSeq.length]);

  // Reset progress when leaving playback or switching base layers.
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
  }, [base]);

  // rAF loop — advance progress at 1 arrow / (2s / speed).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProgress((p) => {
        const next = p + (dt * speed) / 2;
        if (next >= playbackSeq.length) {
          setPlaying(false);
          return playbackSeq.length;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, playbackSeq.length]);

  function togglePlay() {
    if (!playbackSeq.length) return;
    if (progress >= playbackSeq.length) setProgress(0);
    setPlaying((p) => !p);
  }

  function pathD(pts: Pt[]) {
    if (!pts.length) return "";
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  }


  const anyPanelOpen = layersOpen || annotateOpen || playbackOpen;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-surface flex flex-col overflow-hidden"
          : "col-span-12 lg:col-span-8 lg:row-span-5 bg-surface border border-white/5 rounded-3xl overflow-hidden min-h-[520px] flex flex-col relative"
      }
    >
      {/* ============ Docked toolbar (above the map, never on it) ============ */}
      <div className="shrink-0 border-b border-white/10 bg-surface/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen map"}
          >
            {fullscreen ? "⤢ Exit Full" : "⤢ Fullscreen"}
          </button>

          <div className="mx-1 h-5 w-px bg-white/10" />

          {/* Panel toggle buttons */}
          {(
            [
              { key: "layers", label: "Map Layers", open: layersOpen, set: setLayersOpen, badge: `${Object.values(layers).filter(Boolean).length}/${LAYERS.length}` },
              { key: "annotate", label: "Annotate", open: annotateOpen, set: setAnnotateOpen, badge: `${annotations.filter((a) => a.base === base).length}` },
              { key: "playback", label: "Playback", open: playbackOpen, set: setPlaybackOpen, badge: playbackSeq.length ? `${playbackSeq.length}` : undefined },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => p.set(!p.open)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border transition flex items-center gap-1.5 ${
                p.open
                  ? "bg-kairos-blue text-white border-white/10"
                  : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
              }`}
            >
              {p.label}
              {p.badge && (
                <span className="text-[9px] font-mono opacity-80">{p.badge}</span>
              )}
              <span className="text-[9px] opacity-70">{p.open ? "▴" : "▾"}</span>
            </button>
          ))}

          {/* Quick base layer chips */}
          <div className="mx-1 h-5 w-px bg-white/10" />
          <div className="flex gap-1">
            {bases.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => selectBase(b.key)}
                className={`text-[10px] font-bold px-2 py-1.5 rounded border transition ${
                  base === b.key
                    ? "bg-kairos-gold text-bg-deep border-white/10"
                    : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Live map controls — only visible when Live Map is active */}
          {base === "live" && (
            <>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <div className="flex gap-1">
                {(["roadmap", "satellite", "hybrid"] as LiveMapType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLiveMapType(t)}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded border transition capitalize ${
                      liveMapType === t
                        ? "bg-kairos-blue text-white border-white/10"
                        : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStreetView((v) => !v)}
                className={`text-[10px] font-bold px-2 py-1.5 rounded border transition ${
                  streetView
                    ? "bg-kairos-gold text-bg-deep border-white/10"
                    : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                }`}
                title="Toggle Street View split"
              >
                {streetView ? "◨ Street View On" : "◨ Street View"}
              </button>
              <form onSubmit={submitSearch} className="flex items-center gap-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchMsg) setSearchMsg(null);
                    setRecentOpen(true);
                  }}
                  onFocus={() => setRecentOpen(true)}
                  onBlur={() => window.setTimeout(() => setRecentOpen(false), 150)}
                  placeholder="Search address or intersection…"
                  className="w-56 lg:w-72 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-kairos-blue"
                />
                <button
                  type="button"
                  onClick={() => setRecentOpen((v) => !v)}
                  disabled={!recent.length}
                  title={recent.length ? "Recent searches" : "No recent searches yet"}
                  className="text-[10px] font-bold px-2 py-1.5 rounded border border-white/10 bg-white/5 text-slate-300 hover:text-white disabled:opacity-40"
                >
                  🕘
                </button>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="text-[10px] font-bold px-2 py-1.5 rounded border border-white/10 bg-kairos-blue text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                >
                  {searching && (
                    <span className="inline-block size-2.5 border border-white/60 border-t-transparent rounded-full animate-spin" />
                  )}
                  {searching ? "Searching…" : "Go"}
                </button>
                {(searching || searchMsg) && (
                  <span
                    className={`absolute top-full left-0 mt-1 text-[10px] font-mono px-2 py-1 rounded bg-bg-deep/95 border max-w-sm truncate z-30 ${
                      searching
                        ? "text-slate-300 border-white/10"
                        : searchMsg?.tone === "ok"
                        ? "text-green-400 border-green-500/30"
                        : "text-red-400 border-red-500/30"
                    }`}
                    title={searching ? "Geocoding…" : searchMsg?.text}
                  >
                    {searching
                      ? "Geocoding address…"
                      : searchMsg?.tone === "ok"
                      ? `✓ ${searchMsg.text}`
                      : `⚠ ${searchMsg?.text}`}
                  </span>
                )}
                {recentOpen && (recent.length > 0 || landmarks.length > 0) && (
                  <div
                    className="absolute top-full right-0 mt-1 w-72 lg:w-80 bg-bg-deep/98 border border-white/10 rounded-md shadow-xl z-40 overflow-hidden"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {landmarks.length > 0 && (
                      <>
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-kairos-gold">
                            📍 Landmarks
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">{landmarks.length}</span>
                        </div>
                        <ul className="max-h-40 overflow-y-auto border-b border-white/5">
                          {landmarks.map((l) => (
                            <li key={l.id} className="flex items-center gap-1 hover:bg-white/5 group">
                              <span className="pl-2 text-kairos-gold text-[11px]">📍</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery(l.query);
                                  void runSearch(l.query);
                                }}
                                className="flex-1 text-left px-1 py-1.5 min-w-0"
                              >
                                <div className="text-[11px] font-semibold text-white truncate">{l.label}</div>
                                <div className="text-[10px] text-slate-500 truncate">{l.address}</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => renameLandmark(l.id)}
                                title="Rename"
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-white px-1.5"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => removeLandmark(l.id)}
                                title="Remove landmark"
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-red-400 px-2"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecent((prev) => prev.filter((p) => p.pinned));
                        }}
                        title="Clear unpinned searches (pinned stay)"
                        className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400"
                      >
                        Clear
                      </button>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                      {filteredRecent.length === 0 ? (
                        <li className="px-2.5 py-2 text-[10px] text-slate-500 italic">
                          No matches for “{searchQuery}”.
                        </li>
                      ) : (
                        filteredRecent.map((r) => (
                          <li
                            key={`${r.at}-${r.address}`}
                            className={`flex items-center gap-1 hover:bg-white/5 group ${
                              r.pinned ? "bg-kairos-gold/5" : ""
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => togglePin(r)}
                              title={r.pinned ? "Unpin" : "Pin to top"}
                              className={`px-2 py-1.5 text-[11px] transition ${
                                r.pinned
                                  ? "text-kairos-gold"
                                  : "text-slate-600 opacity-60 group-hover:opacity-100 hover:text-kairos-gold"
                              }`}
                            >
                              {r.pinned ? "★" : "☆"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(r.query);
                                void runSearch(r.query);
                              }}
                              className="flex-1 text-left px-1 py-1.5 min-w-0"
                            >
                              <div className="text-[11px] text-white truncate">{r.query}</div>
                              <div className="text-[10px] text-slate-500 truncate">{r.address}</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => saveAsLandmark({ query: r.query, address: r.address })}
                              title="Save as landmark"
                              className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-500 hover:text-kairos-gold px-1.5"
                            >
                              📍
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRecent((prev) => prev.filter((p) => p.at !== r.at || p.address !== r.address))
                              }
                              title="Remove"
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-red-400 px-2"
                            >
                              ✕
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </form>
              <button
                type="button"
                onClick={() => setMapLocked((v) => !v)}
                className={`text-[10px] font-bold px-2 py-1.5 rounded border transition ${
                  mapLocked
                    ? "bg-red-500/80 text-white border-white/10"
                    : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                }`}
                title={
                  mapLocked
                    ? "Map is locked — pan/zoom disabled so annotations stay put"
                    : "Lock the map so annotations stay aligned"
                }
              >
                {mapLocked ? "🔒 Map Locked" : "🔓 Lock Map"}
              </button>
              {landmarks.length > 0 && (
                <div
                  className="flex items-center gap-1 pl-2 ml-1 border-l border-white/10 max-w-[280px] lg:max-w-[420px] overflow-x-auto"
                  title="Saved landmarks — click to jump (works while annotating or playing back)"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
                    📍
                  </span>
                  {landmarks.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(l.query);
                        void runSearch(l.query);
                      }}
                      title={l.address}
                      className="text-[10px] font-bold px-2 py-1.5 rounded border border-kairos-gold/30 bg-kairos-gold/10 text-kairos-gold hover:bg-kairos-gold/20 whitespace-nowrap"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}



          {/* Service selector pushed to the right */}
          <div className="ml-auto flex gap-1">
            {(["7:00 AM", "10:00 AM", "1:00 PM"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => onServiceChange(s)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition border ${
                  service === s
                    ? "bg-kairos-blue text-white border-white/10"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded panel bodies — inline, push the map down; never overlap it */}
        {anyPanelOpen && (
          <div className="border-t border-white/10 px-3 py-3 grid gap-3 md:grid-cols-3 max-h-[40vh] overflow-y-auto bg-surface/90">
            {layersOpen && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Map Layers</h4>
                  <button type="button" onClick={() => setLayersOpen(false)} className="text-[10px] text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="space-y-1.5">
                  {LAYERS.map((l) => {
                    const on = layers[l.key];
                    return (
                      <button
                        type="button"
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
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 w-full text-[10px] font-bold py-1.5 rounded border border-dashed border-white/15 text-kairos-gold hover:bg-white/5 transition"
                >
                  + Upload Aerial Imagery
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
              </div>
            )}

            {annotateOpen && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">
                    Annotate <span className="text-kairos-gold font-mono ml-1">{annotations.filter((a) => a.base === base).length} on {base}</span>
                  </h4>
                  <button type="button" onClick={() => setAnnotateOpen(false)} className="text-[10px] text-slate-400 hover:text-white">✕</button>
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
                        type="button"
                        key={t.k}
                        onClick={() => {
                          setDraft([]);
                          setTool(on ? null : t.k);
                        }}
                        className={`text-[10px] font-bold py-2 rounded border transition ${
                          on ? "text-white border-white/20" : "bg-white/5 text-slate-300 border-white/5 hover:text-white"
                        }`}
                        style={on ? { background: TOOL_COLORS[t.k] } : undefined}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {tool && tool !== "closure" && (
                  <div className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                    Click the map to drop points ({draft.length} placed). <b className="text-white">Double-click</b> or press <b className="text-white">Finish</b> to save.
                  </div>
                )}
                {tool === "closure" && (
                  <div className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                    Click a point on the map to drop a closure marker.
                  </div>
                )}
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={finishPath} disabled={!tool || tool === "closure" || draft.length < 2} className="flex-1 text-[10px] font-bold py-1.5 rounded bg-kairos-blue text-white disabled:opacity-30 disabled:cursor-not-allowed">Finish</button>
                  <button type="button" onClick={undo} className="flex-1 text-[10px] font-bold py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/5">Undo</button>
                  <button type="button" onClick={cancelDraft} className="flex-1 text-[10px] font-bold py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/5">Cancel</button>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button type="button" onClick={exportAnnotations} disabled={!annotations.length} className="text-[10px] font-bold py-1.5 rounded border border-kairos-blue/40 text-kairos-blue hover:bg-kairos-blue/10 transition disabled:opacity-30 disabled:cursor-not-allowed">↓ Export JSON</button>
                  <button type="button" onClick={() => importRef.current?.click()} className="text-[10px] font-bold py-1.5 rounded border border-kairos-gold/40 text-kairos-gold hover:bg-kairos-gold/10 transition">↑ Import JSON</button>
                  <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
                </div>
                <button type="button" onClick={clearAll} className="mt-1.5 w-full text-[10px] font-bold py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">Clear All Annotations</button>

                {/* ===== Traffic Plans ===== */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-white">
                      Traffic Plans <span className="text-kairos-gold font-mono ml-1">{plans.length}</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setPlansOpen((v) => !v)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      {plansOpen ? "Hide" : "Show"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={savePlan}
                    className="w-full text-[10px] font-bold py-1.5 rounded bg-kairos-gold text-bg-deep hover:brightness-110 transition flex items-center justify-center gap-1.5"
                    title="Save current annotations, base layer, and map view as a reusable traffic plan"
                  >
                    💾 Save Current as Traffic Plan
                  </button>
                  {plansOpen && (
                    <ul className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {plans.length === 0 ? (
                        <li className="text-[10px] text-slate-500 italic px-1 py-1">
                          No saved plans yet. Save the current setup to reuse later.
                        </li>
                      ) : (
                        plans.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-1 rounded bg-white/5 border border-white/5 hover:border-kairos-gold/30 group"
                          >
                            <button
                              type="button"
                              onClick={() => loadPlan(p.id)}
                              className="flex-1 min-w-0 text-left px-2 py-1.5"
                              title="Load this plan"
                            >
                              <div className="text-[11px] font-semibold text-white truncate">{p.name}</div>
                              <div className="text-[9px] font-mono text-slate-500 truncate">
                                {p.base} · {p.annotations.length} ann · {new Date(p.savedAt).toLocaleDateString()}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => renamePlan(p.id)}
                              title="Rename"
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-white px-1.5"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePlan(p.id)}
                              title="Delete plan"
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-red-400 px-2"
                            >
                              ✕
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {playbackOpen && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Traffic Flow Playback</h4>
                  <button type="button" onClick={() => setPlaybackOpen(false)} className="text-[10px] text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={togglePlay} disabled={!playbackSeq.length} className="size-9 rounded-full bg-kairos-blue text-white grid place-items-center hover:brightness-110 transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0" title={playing ? "Pause" : "Play"}>
                    {playing ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1 L11 6 L2 11 Z" /></svg>
                    )}
                  </button>
                  <button type="button" onClick={() => { setPlaying(false); setProgress(0); }} disabled={!playbackSeq.length} className="size-9 rounded-full bg-white/5 border border-white/10 text-slate-300 grid place-items-center hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0" title="Restart">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1 v4 L1 3 Z" /><rect x="1" y="1" width="2" height="10" rx="0.5" /></svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-mono text-slate-400">
                        {playbackSeq.length ? `${Math.min(Math.ceil(progress), playbackSeq.length)} / ${playbackSeq.length}` : "no arrows"}
                      </p>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-kairos-blue transition-[width] duration-100" style={{ width: playbackSeq.length ? `${(progress / playbackSeq.length) * 100}%` : "0%" }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1 justify-end">
                  {([0.5, 1, 2, 4] as const).map((s) => (
                    <button type="button" key={s} onClick={() => setSpeed(s)} className={`text-[10px] font-bold px-2 py-1 rounded transition ${speed === s ? "bg-kairos-gold text-bg-deep" : "bg-white/5 text-slate-400 hover:text-white"}`}>{s}×</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ Map surface (fills remaining space) ============ */}
      <div
        ref={surfaceRef}
        onClick={onSurfaceClick}
        onMouseMove={onSurfaceMove}
        onDoubleClick={finishPath}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={onSurfacePointerUp}
        onPointerCancel={onSurfacePointerUp}
        className={`relative flex-1 min-h-0 overflow-hidden ${
          tool ? "cursor-crosshair" : imgZoom > 1 && base !== "live" ? (panDrag.current ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
      >
        <div
          ref={contentRef}
          className="absolute inset-0"
          style={
            base === "live"
              ? undefined
              : {
                  transform: `translate(${imgPan.x}%, ${imgPan.y}%) scale(${imgZoom})`,
                  transformOrigin: "center",
                  transition: panDrag.current ? "none" : "transform 150ms ease-out",
                }
          }
        >
        {base === "live" ? (
          <div className="absolute inset-0">
            <LiveMap ref={liveMapRef} mapType={liveMapType} streetView={streetView} />
          </div>
        ) : (
          <>
            <img
              src={activeSrc}
              alt="Wheeler Avenue campus map"
              className="w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute inset-0 map-grid opacity-40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 via-transparent to-bg-deep/20 pointer-events-none" />
          </>
        )}

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

          {/* Saved annotations (path-based). During playback, reveal based on progress. */}
          {(() => {
            const playbackIds = playing || progress > 0
              ? new Set(playbackSeq.map((a) => a.id))
              : null;
            return visibleAnnotations.map((a) => {
              if (a.kind === "closure") return null;
              // Playback overrides normal render for arrows in the sequence.
              if (playbackIds?.has(a.id)) return null;
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
            });
          })()}

          {/* Playback layer: reveal arrows in saved order. */}
          {(playing || progress > 0) &&
            playbackSeq.map((a, i) => {
              const isDone = i < Math.floor(progress);
              const isCurrent = i === Math.floor(progress);
              const frac = isCurrent ? progress - Math.floor(progress) : 0;
              const hidden = !isDone && !isCurrent;
              if (hidden) return null;
              const reveal = isDone ? 1 : frac;
              return (
                <path
                  key={`pb-${a.id}`}
                  d={pathD(a.points)}
                  stroke={TOOL_COLORS[a.kind]}
                  strokeWidth="1.1"
                  fill="none"
                  markerEnd={reveal > 0.95 ? `url(#arr-${a.kind})` : undefined}
                  pathLength={100}
                  strokeDasharray="100 100"
                  strokeDashoffset={100 - 100 * reveal}
                  style={{
                    filter: isCurrent
                      ? `drop-shadow(0 0 2px ${TOOL_COLORS[a.kind]})`
                      : undefined,
                    transition: playing ? "none" : "stroke-dashoffset 200ms",
                  }}
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
        {/* /transformed content wrapper */}

        {/* Site label — small overlay inside the map, unaffected by zoom */}
        <div className="absolute bottom-3 left-3 z-10 bg-surface/85 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 pointer-events-none">
          <p className="text-[9px] font-mono text-slate-500 uppercase">Site</p>
          <p className="text-xs font-bold text-white">Wheeler Ave Baptist Church</p>
        </div>

        {/* ============ Compact floating map toolbar ============ */}
        <div
          className="absolute top-3 right-3 z-20 flex flex-col gap-1 rounded-lg border border-white/10 bg-surface/85 backdrop-blur-xl p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {(
            [
              { key: "in", label: "+", title: "Zoom in", onClick: zoomIn },
              { key: "out", label: "−", title: "Zoom out", onClick: zoomOut },
              { key: "reset", label: "⟳", title: "Reset view", onClick: resetView },
              {
                key: "layers",
                label: "☰",
                title: layersOpen ? "Hide layers" : "Show layers",
                active: layersOpen,
                onClick: () => setLayersOpen((v) => !v),
              },
              {
                key: "annot",
                label: "✎",
                title: annotateOpen ? "Hide annotate" : "Show annotate",
                active: annotateOpen,
                onClick: () => setAnnotateOpen((v) => !v),
              },
              {
                key: "full",
                label: fullscreen ? "⤡" : "⤢",
                title: fullscreen ? "Exit fullscreen" : "Fullscreen",
                active: fullscreen,
                onClick: () => setFullscreen((v) => !v),
              },
            ] as const
          ).map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={b.onClick}
              title={b.title}
              aria-label={b.title}
              className={`size-8 grid place-items-center rounded text-sm font-bold transition ${
                "active" in b && b.active
                  ? "bg-kairos-blue text-white"
                  : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {b.label}
            </button>
          ))}
          {base !== "live" && imgZoom !== 1 && (
            <div className="text-[9px] font-mono text-slate-400 text-center pt-0.5">
              {Math.round(imgZoom * 100)}%
            </div>
          )}
        </div>
      </div>



      {pendingImport && (
        <div className="absolute inset-0 z-30 bg-bg-deep/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-kairos-gold">
                  Import Annotations
                </p>
                <h4 className="mt-1 text-lg font-bold text-white">
                  Pick base layers
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="size-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
                aria-label="Close import picker"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {(["street", "aerial", "lot", "custom"] as BaseKey[]).map((baseKey) => {
                const count = pendingImport.annotations.filter((a) => a.base === baseKey).length;
                const disabled = count === 0;
                const label =
                  baseKey === "lot"
                    ? "Lot Plan"
                    : baseKey === "custom"
                      ? "Custom Upload"
                      : baseKey[0].toUpperCase() + baseKey.slice(1);
                return (
                  <label
                    key={baseKey}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                      disabled
                        ? "border-white/5 bg-white/[0.02] opacity-45"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={pendingImport.selectedBases[baseKey]}
                        disabled={disabled}
                        onChange={(event) => setImportBase(baseKey, event.target.checked)}
                        className="size-4 accent-kairos-blue"
                      />
                      <span className="text-sm font-bold text-white">{label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {count} item{count === 1 ? "" : "s"}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["merge", "replace"] as ImportMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() =>
                    setPendingImport((current) =>
                      current ? { ...current, mode } : current,
                    )
                  }
                  className={`rounded-lg border py-2 text-[10px] font-bold uppercase tracking-widest transition ${
                    pendingImport.mode === mode
                      ? "bg-kairos-blue text-white border-white/10"
                      : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitImport}
                disabled={!pendingImport.annotations.some((a) => pendingImport.selectedBases[a.base])}
                className="flex-1 rounded-lg bg-kairos-gold py-2 text-xs font-black text-bg-deep transition hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Import Selected
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
