import { useMemo, useState } from "react";
import {
  SERVICES,
  countDate,
  fmtDate,
  type LotCount,
  type ParkingState,
} from "@/lib/parking-lots";

function keyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** most recent Sunday on or before today */
function lastSunday() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return keyOf(d);
}

function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

function shiftSunday(key: string, weeks: number) {
  const d = parseKey(key);
  d.setDate(d.getDate() + weeks * 7);
  return keyOf(d);
}

function shortDate(key: string) {
  return parseKey(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Props = {
  state: ParkingState;
  setState: (next: ParkingState) => void;
};

export function SundayServiceCounts({ state, setState }: Props) {
  const [sunday, setSunday] = useState<string>(lastSunday);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const cell = (lotId: string, sid: string) => `${lotId}|${sid}`;

  /** latest recorded count per lot per service for any date */
  const recorded = useMemo(() => {
    const map: Record<string, Record<string, LotCount>> = {};
    for (const c of state.counts) {
      const date = countDate(c);
      if (!date) continue;
      const bucket = (map[date] ||= {});
      const k = cell(c.lotId, c.serviceId ?? SERVICES[0].id);
      const cur = bucket[k];
      if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) bucket[k] = c;
    }
    return map;
  }, [state.counts]);

  const totalSpaces = state.lots.reduce((a, l) => a + l.spaces, 0);

  /** utilization per Sunday: cars recorded / (capacity x services recorded) */
  const weekly = useMemo(() => {
    const dates = Object.keys(recorded).sort();
    return dates
      .map((date) => {
        const bucket = recorded[date];
        const recs = Object.values(bucket);
        const cars = recs.reduce((a, r) => a + r.cars, 0);
        const services = new Set(recs.map((r) => r.serviceId ?? SERVICES[0].id)).size;
        const capacity = totalSpaces * Math.max(1, services);
        const pct = capacity ? Math.min(100, Math.round((cars / capacity) * 100)) : 0;
        const perLot: Record<string, number> = {};
        for (const r of recs) perLot[r.lotId] = (perLot[r.lotId] ?? 0) + r.cars;
        return { date, cars, services, pct, perLot };
      })
      .filter((w) => w.cars > 0 || w.services > 0);
  }, [recorded, totalSpaces]);

  const thisWeek = weekly.find((w) => w.date === sunday);
  const prevKey = shiftSunday(sunday, -1);
  const prevWeek = weekly.find((w) => w.date === prevKey) ?? [...weekly].reverse().find((w) => w.date < sunday);

  const filled = state.lots.length * SERVICES.length;
  const entered = Object.values(draft).filter((v) => v !== "" && v !== undefined).length;

  const prefillFromRecords = () => {
    const bucket = recorded[sunday] ?? {};
    const next: Record<string, string> = {};
    for (const lot of state.lots) {
      for (const s of SERVICES) {
        const rec = bucket[cell(lot.id, s.id)];
        if (rec) next[cell(lot.id, s.id)] = String(rec.cars);
      }
    }
    setDraft(next);
    setSaved(false);
  };

  const saveWeek = () => {
    const stamp = Date.now();
    const additions: LotCount[] = [];
    state.lots.forEach((lot, li) => {
      SERVICES.forEach((s, si) => {
        const raw = draft[cell(lot.id, s.id)];
        if (raw === undefined || raw === "") return;
        const value = Math.max(0, Math.floor(Number(raw) || 0));
        const [h, m] = s.time.split(":");
        const [y, mo, d] = sunday.split("-").map(Number);
        const at = new Date();
        if (y && mo && d) at.setFullYear(y, mo - 1, d);
        at.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
        additions.push({
          id: `${lot.id}-${s.id}-${stamp}-${li}${si}`,
          lotId: lot.id,
          serviceId: s.id,
          date: sunday,
          at: at.toISOString(),
          cars: value,
          full: lot.spaces > 0 && value >= lot.spaces,
        });
      });
    });
    if (additions.length === 0) return;
    setState({ ...state, counts: [...additions, ...state.counts].slice(0, 4000) });
    setSaved(true);
  };

  const lotDelta = (lotId: string) => {
    if (!thisWeek || !prevWeek) return null;
    const now = thisWeek.perLot[lotId];
    const before = prevWeek.perLot[lotId];
    if (now === undefined || before === undefined) return null;
    return now - before;
  };

  const trendChip = (v: number | null) => {
    if (v === null) return <span className="text-slate-500">—</span>;
    if (v === 0) return <span className="text-slate-400">±0</span>;
    return (
      <span className={v > 0 ? "text-amber-400" : "text-emerald-400"}>
        {v > 0 ? "▲" : "▼"} {Math.abs(v)}
      </span>
    );
  };

  return (
    <div className="mt-6 bg-surface border border-white/5 rounded-2xl p-5">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Sunday service counts
          </h3>
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
            {fmtDate(sunday)} · {entered}/{filled} entries filled
            {thisWeek ? ` · ${thisWeek.pct}% utilization` : ""}
          </p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSunday(shiftSunday(sunday, -1));
              setDraft({});
              setSaved(false);
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
          >
            ‹ Prev
          </button>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Sunday
            </span>
            <input
              type="date"
              value={sunday}
              onChange={(e) => {
                const picked = e.target.value;
                if (!picked) return;
                const d = parseKey(picked);
                d.setDate(d.getDate() - d.getDay());
                setSunday(keyOf(d));
                setDraft({});
                setSaved(false);
              }}
              className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setSunday(shiftSunday(sunday, 1));
              setDraft({});
              setSaved(false);
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
          >
            Next ›
          </button>
          <button
            type="button"
            onClick={prefillFromRecords}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5"
          >
            Load saved
          </button>
          <button
            type="button"
            onClick={saveWeek}
            disabled={entered === 0}
            className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white text-slate-900 disabled:opacity-40"
          >
            {saved ? "Saved ✓" : "Save Sunday"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              <th className="py-2 pr-3">Lot</th>
              {SERVICES.map((s) => (
                <th key={s.id} className="py-2 pr-3">
                  {s.name}
                </th>
              ))}
              <th className="py-2 pr-3">Week total</th>
              <th className="py-2 pr-3">Vs prior Sunday</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {state.lots.map((lot) => {
              const rowTotal = SERVICES.reduce((a, s) => {
                const raw = draft[cell(lot.id, s.id)];
                const rec = recorded[sunday]?.[cell(lot.id, s.id)];
                const v = raw !== undefined && raw !== "" ? Number(raw) || 0 : (rec?.cars ?? 0);
                return a + v;
              }, 0);
              return (
                <tr key={lot.id} className="text-xs">
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2 font-bold text-white">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: lot.color }}
                      />
                      {lot.name}
                      {lot.spaces ? (
                        <span className="text-[10px] font-mono text-slate-500">/{lot.spaces}</span>
                      ) : null}
                    </span>
                  </td>
                  {SERVICES.map((s) => {
                    const k = cell(lot.id, s.id);
                    const rec = recorded[sunday]?.[k];
                    return (
                      <td key={s.id} className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={draft[k] ?? ""}
                          placeholder={rec ? String(rec.cars) : "—"}
                          onChange={(e) => {
                            setDraft((p) => ({ ...p, [k]: e.target.value }));
                            setSaved(false);
                          }}
                          className="w-20 bg-surface-bright border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white tabular-nums"
                        />
                      </td>
                    );
                  })}
                  <td className="py-2 pr-3 font-mono text-white tabular-nums">{rowTotal}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{trendChip(lotDelta(lot.id))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-5 mb-2">
        Utilization by Sunday
      </h4>
      {weekly.length === 0 ? (
        <p className="text-xs text-slate-500">
          Enter counts above and save a Sunday to start the utilization trend.
        </p>
      ) : (
        <div className="space-y-2">
          {weekly.map((w, i) => {
            const prev = weekly[i - 1];
            const d = prev ? w.pct - prev.pct : null;
            return (
              <div key={w.date} className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 text-[11px] font-mono ${
                    w.date === sunday ? "text-white font-bold" : "text-slate-400"
                  }`}
                >
                  {shortDate(w.date)}
                </span>
                <span className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-white/60"
                    style={{ width: `${w.pct}%` }}
                  />
                </span>
                <span className="w-14 text-right text-[11px] font-mono text-white tabular-nums">
                  {w.pct}%
                </span>
                <span className="w-20 text-right text-[11px] font-mono tabular-nums">
                  {d === null ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <span className={d > 0 ? "text-amber-400" : d < 0 ? "text-emerald-400" : "text-slate-400"}>
                      {d > 0 ? "▲" : d < 0 ? "▼" : "±"} {Math.abs(d)} pts
                    </span>
                  )}
                </span>
                <span className="w-24 text-right text-[11px] font-mono text-slate-500">
                  {w.cars} cars
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
