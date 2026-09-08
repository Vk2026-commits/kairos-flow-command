import { useMemo, useState } from "react";

import {
  useParkingState,
  SERVICES,
  toDateKey,
  type LotCount,
} from "@/lib/parking-lots";

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Quick live count entry: any lot, any date/time, submitted immediately. */
export function LiveCountForm() {
  const [state, setState] = useParkingState();
  const [lotId, setLotId] = useState<string>("");
  const [cars, setCars] = useState("");
  const [full, setFull] = useState(false);
  const [note, setNote] = useState("");
  const [serviceId, setServiceId] = useState<string>(SERVICES[0].id);
  const [date, setDate] = useState(() => toDateKey(new Date().toISOString()));
  const [time, setTime] = useState(nowTime);
  const [flash, setFlash] = useState("");

  const activeLotId = lotId || state.lots[0]?.id || "";
  const lot = state.lots.find((l) => l.id === activeLotId);

  const recent = useMemo(
    () =>
      [...state.counts]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 5),
    [state.counts],
  );

  const submit = () => {
    if (!lot) return;
    const value = full && cars.trim() === "" ? lot.spaces : Math.max(0, Math.floor(Number(cars) || 0));
    const [y, mo, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const at = new Date();
    if (y && mo && d) at.setFullYear(y, mo - 1, d);
    at.setHours(Number.isFinite(h) ? h : at.getHours(), Number.isFinite(mi) ? mi : 0, 0, 0);
    const entry: LotCount = {
      id: `${lot.id}-live-${Date.now()}`,
      lotId: lot.id,
      serviceId,
      date,
      at: at.toISOString(),
      cars: value,
      full: full || (lot.spaces > 0 && value >= lot.spaces),
      note: note.trim() || undefined,
    };
    setState({ ...state, counts: [entry, ...state.counts].slice(0, 2000) });
    setCars("");
    setNote("");
    setFull(false);
    setTime(nowTime());
    setFlash(`Logged ${value} cars in ${lot.name}`);
    window.setTimeout(() => setFlash(""), 2500);
  };

  const useNow = () => {
    setDate(toDateKey(new Date().toISOString()));
    setTime(nowTime());
  };

  return (
    <div className="mt-6 bg-surface border border-kairos-blue/30 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            Live vehicle count
          </h3>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Submit a real count any time — not tied to a saved service sheet
          </p>
        </div>
        <button
          onClick={useNow}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition"
        >
          Use right now
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
        <label className="flex flex-col gap-1 xl:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lot</span>
          <select
            value={activeLotId}
            onChange={(e) => setLotId(e.target.value)}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {state.lots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Cars counted
          </span>
          <input
            type="number"
            min={0}
            value={cars}
            placeholder="0"
            onChange={(e) => setCars(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Service window
          </span>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2 xl:col-span-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Note (optional)
          </span>
          <input
            value={note}
            placeholder="e.g. overflow began, gate backed up"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="flex items-center gap-2 xl:col-span-1">
          <input
            type="checkbox"
            checked={full}
            onChange={(e) => setFull(e.target.checked)}
            className="size-4 accent-red-500"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Lot is full
          </span>
        </label>

        <button
          onClick={submit}
          disabled={!lot}
          className="px-4 py-2.5 rounded-lg bg-kairos-blue/20 border border-kairos-blue text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/30 disabled:opacity-40 transition"
        >
          Submit count
        </button>
      </div>

      {flash && (
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          {flash}
        </p>
      )}

      {recent.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
          {recent.map((c) => {
            const l = state.lots.find((x) => x.id === c.lotId);
            return (
              <span
                key={c.id}
                className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-2 py-1 rounded bg-white/[0.04] border border-white/5"
              >
                {l?.name ?? c.lotId} · {c.full ? "FULL" : c.cars} ·{" "}
                {new Date(c.at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
