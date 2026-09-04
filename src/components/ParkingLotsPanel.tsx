import { useMemo, useState } from "react";
import { useParkingState, SERVICES, type LotCount } from "@/lib/parking-lots";

function fmt(at: string) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const NEW_LOT_COLORS = [
  "#f59e0b",
  "#14b8a6",
  "#ec4899",
  "#8b5cf6",
  "#0ea5e9",
  "#84cc16",
  "#f43f5e",
  "#64748b",
];

export function ParkingLotsPanel() {
  const [state, setState] = useParkingState();
  const [serviceId, setServiceId] = useState<string>(SERVICES[0].id);
  const [time, setTime] = useState(SERVICES[0].time);
  const [cars, setCars] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(NEW_LOT_COLORS[0]);
  const [newSpaces, setNewSpaces] = useState("");

  const service = SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0];

  const pickService = (id: string) => {
    const s = SERVICES.find((x) => x.id === id);
    if (!s) return;
    setServiceId(s.id);
    setTime(s.time);
    setCars({});
  };

  /** latest count per lot for the selected service */
  const latest = useMemo(() => {
    const map: Record<string, LotCount | undefined> = {};
    for (const c of state.counts) {
      if ((c.serviceId ?? SERVICES[0].id) !== serviceId) continue;
      const cur = map[c.lotId];
      if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) map[c.lotId] = c;
    }
    return map;
  }, [state.counts, serviceId]);

  /** latest count per lot per service, for the summary row */
  const byService = useMemo(() => {
    const map: Record<string, Record<string, LotCount | undefined>> = {};
    for (const c of state.counts) {
      const sid = c.serviceId ?? SERVICES[0].id;
      const bucket = (map[sid] ||= {});
      const cur = bucket[c.lotId];
      if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) bucket[c.lotId] = c;
    }
    return map;
  }, [state.counts]);

  const totalSpaces = state.lots.reduce((a, l) => a + l.spaces, 0);
  const totalCars = state.lots.reduce((a, l) => a + (latest[l.id]?.cars ?? 0), 0);

  const setSpaces = (id: string, spaces: number) =>
    setState({
      ...state,
      lots: state.lots.map((l) => (l.id === id ? { ...l, spaces } : l)),
    });

  const record = (lotId: string, full: boolean) => {
    const lot = state.lots.find((l) => l.id === lotId);
    if (!lot) return;
    const raw = cars[lotId];
    const value = full && (raw === undefined || raw === "") ? lot.spaces : Number(raw ?? 0);
    const [h, m] = time.split(":");
    const at = new Date();
    at.setHours(Number(h) || at.getHours(), Number(m) || 0, 0, 0);
    const entry: LotCount = {
      id: `${lotId}-${Date.now()}`,
      lotId,
      serviceId,
      at: at.toISOString(),
      cars: Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)),
      full: full || (lot.spaces > 0 && value >= lot.spaces),
    };
    setState({ ...state, counts: [entry, ...state.counts].slice(0, 500) });
    setCars((prev) => ({ ...prev, [lotId]: "" }));
  };


  const removeCount = (id: string) =>
    setState({ ...state, counts: state.counts.filter((c) => c.id !== id) });

  const addLot = () => {
    const name = newName.trim();
    if (!name) return;
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lot";
    let id = base;
    let i = 2;
    while (state.lots.some((l) => l.id === id)) id = `${base}-${i++}`;
    setState({
      ...state,
      lots: [
        ...state.lots,
        { id, name, color: newColor, spaces: Math.max(0, Math.floor(Number(newSpaces) || 0)) },
      ],
    });
    setNewName("");
    setNewSpaces("");
    setNewColor(NEW_LOT_COLORS[(state.lots.length + 1) % NEW_LOT_COLORS.length]);
    setAdding(false);
  };

  const removeLot = (id: string) => {
    const lot = state.lots.find((l) => l.id === id);
    if (lot && !window.confirm(`Remove ${lot.name} and its recorded counts?`)) return;
    setState({
      ...state,
      lots: state.lots.filter((l) => l.id !== id),
      counts: state.counts.filter((c) => c.lotId !== id),
    });
  };

  const renameLot = (id: string, name: string) =>
    setState({ ...state, lots: state.lots.map((l) => (l.id === id ? { ...l, name } : l)) });

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Parking Lots</h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">
            {state.lots.length} lots · {totalSpaces} spaces · {totalCars} cars on latest count
          </p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Observation time
          </span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
          />
        </label>
      </div>

      <div className="mb-4">
        {adding ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 min-w-48 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Lot name
              </span>
              <input
                autoFocus
                value={newName}
                placeholder="e.g. Overflow Lot"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLot()}
                className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="flex flex-col gap-1 w-28">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Spaces
              </span>
              <input
                type="number"
                min={0}
                value={newSpaces}
                placeholder="0"
                onChange={(e) => setNewSpaces(e.target.value)}
                className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Color
              </span>
              <div className="flex gap-1.5">
                {NEW_LOT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    aria-label={`Choose color ${c}`}
                    className={`size-6 rounded-full transition ${
                      newColor === c ? "ring-2 ring-white" : "ring-1 ring-white/20"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={addLot}
                disabled={!newName.trim()}
                className="px-4 py-2 rounded-lg bg-kairos-blue/15 border border-kairos-blue/40 text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/25 disabled:opacity-40 transition"
              >
                Add lot
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 rounded-lg bg-kairos-blue/10 border border-kairos-blue/40 text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/20 transition"
          >
            + Add lot
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.lots.map((lot) => {
          const last = latest[lot.id];
          const pct = lot.spaces > 0 && last ? Math.min(100, (last.cars / lot.spaces) * 100) : 0;
          return (
            <div
              key={lot.id}
              className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: lot.color }}
                />
                <input
                  value={lot.name}
                  onChange={(e) => renameLot(lot.id, e.target.value)}
                  aria-label="Lot name"
                  className="text-sm font-bold text-white flex-1 bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 rounded px-1 py-0.5 outline-none"
                />
                {last?.full && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                    Full
                  </span>
                )}
                <button
                  onClick={() => removeLot(lot.id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition"
                >
                  Remove
                </button>
              </div>

              <div className="flex items-end gap-3">
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Total spaces
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={lot.spaces}
                    onChange={(e) => setSpaces(lot.id, Number(e.target.value))}
                    className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Cars now
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder={String(last?.cars ?? 0)}
                    value={cars[lot.id] ?? ""}
                    onChange={(e) => setCars((p) => ({ ...p, [lot.id]: e.target.value }))}
                    className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  />
                </label>
              </div>

              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: lot.color }}
                />
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase">
                {last
                  ? `${last.cars}/${lot.spaces || "?"} · ${fmt(last.at)}`
                  : "No counts recorded yet"}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => record(lot.id, false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-kairos-blue/10 border border-kairos-blue/40 text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/20 transition"
                >
                  Record count
                </button>
                <button
                  onClick={() => record(lot.id, true)}
                  className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition"
                >
                  Mark full
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-surface border border-white/5 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-3">
          Count history
        </h3>
        {state.counts.length === 0 ? (
          <p className="text-xs text-slate-500">
            Record a count on any lot to start the history log.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {state.counts.map((c) => {
              const lot = state.lots.find((l) => l.id === c.lotId);
              return (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: lot?.color ?? "#64748b" }}
                  />
                  <span className="text-xs font-bold text-white w-36 truncate">
                    {lot?.name ?? c.lotId}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex-1">{fmt(c.at)}</span>
                  <span className="text-xs font-mono text-white tabular-nums">
                    {c.cars}
                    {lot?.spaces ? `/${lot.spaces}` : ""}
                  </span>
                  {c.full && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">
                      Full
                    </span>
                  )}
                  <button
                    onClick={() => removeCount(c.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
