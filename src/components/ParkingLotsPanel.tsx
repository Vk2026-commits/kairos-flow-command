import { useMemo, useState } from "react";
import { useParkingState, type LotCount } from "@/lib/parking-lots";

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

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
  const [time, setTime] = useState(timeNow);
  const [cars, setCars] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(NEW_LOT_COLORS[0]);
  const [newSpaces, setNewSpaces] = useState("");

  const latest = useMemo(() => {
    const map: Record<string, LotCount | undefined> = {};
    for (const c of state.counts) {
      const cur = map[c.lotId];
      if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) map[c.lotId] = c;
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
      at: at.toISOString(),
      cars: Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)),
      full: full || (lot.spaces > 0 && value >= lot.spaces),
    };
    setState({ ...state, counts: [entry, ...state.counts].slice(0, 500) });
    setCars((prev) => ({ ...prev, [lotId]: "" }));
  };

  const removeCount = (id: string) =>
    setState({ ...state, counts: state.counts.filter((c) => c.id !== id) });

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
                <h3 className="text-sm font-bold text-white flex-1">{lot.name}</h3>
                {last?.full && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                    Full
                  </span>
                )}
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
