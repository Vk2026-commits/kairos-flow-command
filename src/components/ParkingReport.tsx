import { useMemo, useState } from "react";
import {
  SERVICES,
  countDate,
  fmtDate,
  serviceName,
  type ParkingState,
  type LotCount,
} from "@/lib/parking-lots";

function monthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function fmtMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtTime(at: string) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** last count per lot for a given date + service */
function latestPerLot(counts: LotCount[]) {
  const map: Record<string, LotCount> = {};
  for (const c of counts) {
    const cur = map[c.lotId];
    if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) map[c.lotId] = c;
  }
  return map;
}

export function ParkingReport({ state }: { state: ParkingState }) {
  const months = useMemo(() => {
    const set = new Set(state.counts.map((c) => monthKey(countDate(c))).filter(Boolean));
    const now = new Date();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return [...set].sort().reverse();
  }, [state.counts]);

  const [month, setMonth] = useState(months[0] ?? "");
  const active = months.includes(month) ? month : (months[0] ?? "");

  const inMonth = useMemo(
    () => state.counts.filter((c) => monthKey(countDate(c)) === active),
    [state.counts, active],
  );

  /** one saved session = a date + service pairing */
  const sessions = useMemo(() => {
    const groups: Record<string, LotCount[]> = {};
    for (const c of inMonth) {
      const key = `${countDate(c)}|${c.serviceId ?? SERVICES[0].id}`;
      (groups[key] ||= []).push(c);
    }
    return Object.entries(groups)
      .map(([key, counts]) => {
        const [date, sid] = key.split("|");
        const last = latestPerLot(counts);
        const cars = Object.values(last).reduce((a, c) => a + c.cars, 0);
        const fullLots = Object.values(last).filter((c) => c.full);
        return { key, date, sid, counts, last, cars, fullLots };
      })
      .sort((a, b) => (a.date === b.date ? a.sid.localeCompare(b.sid) : b.date.localeCompare(a.date)));
  }, [inMonth]);

  const perLot = useMemo(
    () =>
      state.lots.map((lot) => {
        const rows = sessions
          .map((s) => ({ session: s, rec: s.last[lot.id] }))
          .filter((r) => r.rec) as { session: (typeof sessions)[number]; rec: LotCount }[];
        const peak = rows.reduce<{ cars: number; label: string }>(
          (best, r) =>
            r.rec.cars > best.cars
              ? { cars: r.rec.cars, label: `${fmtDate(r.session.date)} · ${serviceName(r.session.sid)}` }
              : best,
          { cars: 0, label: "—" },
        );
        const fullTimes = rows.filter((r) => r.rec.full);
        const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.rec.cars, 0) / rows.length) : 0;
        return { lot, rows, peak, fullTimes, avg };
      }),
    [state.lots, sessions],
  );

  const perService = useMemo(
    () =>
      SERVICES.map((s) => {
        const list = sessions.filter((x) => x.sid === s.id);
        const avg = list.length ? Math.round(list.reduce((a, x) => a + x.cars, 0) / list.length) : 0;
        const peak = list.reduce((a, x) => Math.max(a, x.cars), 0);
        const fulls = list.reduce((a, x) => a + x.fullLots.length, 0);
        return { service: s, count: list.length, avg, peak, fulls };
      }),
    [sessions],
  );

  const busiest = sessions.reduce<(typeof sessions)[number] | null>(
    (best, s) => (!best || s.cars > best.cars ? s : best),
    null,
  );
  const monthTotal = sessions.reduce((a, s) => a + s.cars, 0);
  const totalSpaces = state.lots.reduce((a, l) => a + l.spaces, 0);

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-surface border border-white/5 rounded-2xl p-5">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              Monthly report
            </h3>
            <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
              {fmtMonth(active)} · {sessions.length} saved services · {monthTotal} cars counted
            </p>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Month
            </span>
            <select
              value={active}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {fmtMonth(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500">
            No saved services this month yet. Pick a service date, record counts, then save the
            service.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Services saved", value: String(sessions.length) },
                { label: "Cars counted", value: String(monthTotal) },
                {
                  label: "Busiest service",
                  value: busiest ? `${busiest.cars} cars` : "—",
                  sub: busiest ? `${fmtDate(busiest.date)} · ${serviceName(busiest.sid)}` : "",
                },
                {
                  label: "Lot-fulls logged",
                  value: String(sessions.reduce((a, s) => a + s.fullLots.length, 0)),
                },
              ].map((k) => (
                <div key={k.label} className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {k.label}
                  </p>
                  <p className="text-lg font-mono text-white tabular-nums">{k.value}</p>
                  {k.sub && <p className="text-[10px] text-slate-500">{k.sub}</p>}
                </div>
              ))}
            </div>

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              By service time
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {perService.map((s) => (
                <div key={s.service.id} className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-xs font-bold text-white">{s.service.name}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {s.count} saved · avg {s.avg} cars · peak {s.peak}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    {s.fulls} lot-fulls
                  </p>
                </div>
              ))}
            </div>

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              By lot
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="py-2 pr-3">Lot</th>
                    <th className="py-2 pr-3">Avg</th>
                    <th className="py-2 pr-3">Peak</th>
                    <th className="py-2 pr-3">Peak service</th>
                    <th className="py-2 pr-3">Times full</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {perLot.map((p) => (
                    <tr key={p.lot.id} className="text-xs">
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-2 font-bold text-white">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: p.lot.color }}
                          />
                          {p.lot.name}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-slate-300 tabular-nums">{p.avg}</td>
                      <td className="py-2 pr-3 font-mono text-white tabular-nums">
                        {p.peak.cars}
                        {p.lot.spaces ? `/${p.lot.spaces}` : ""}
                      </td>
                      <td className="py-2 pr-3 text-[11px] text-slate-400">{p.peak.label}</td>
                      <td className="py-2 pr-3 font-mono text-slate-300 tabular-nums">
                        {p.fullTimes.length ? (
                          <span className="text-red-400">{p.fullTimes.length}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {perLot.some((p) => p.fullTimes.length > 0) && (
              <>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-5 mb-2">
                  When lots filled up
                </h4>
                <div className="space-y-1">
                  {perLot.flatMap((p) =>
                    p.fullTimes.map((f) => (
                      <p key={`${p.lot.id}-${f.rec.id}`} className="text-[11px] font-mono text-slate-400">
                        <span className="text-white font-bold">{p.lot.name}</span> filled at{" "}
                        {fmtTime(f.rec.at)} · {fmtDate(f.session.date)} ·{" "}
                        {serviceName(f.session.sid)}
                      </p>
                    )),
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="bg-surface border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">
          Saved services
        </h3>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500">Nothing saved for {fmtMonth(active)} yet.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((s) => (
              <div key={s.key} className="bg-white/[0.03] rounded-xl p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs font-bold text-white">
                    {fmtDate(s.date)} · {serviceName(s.sid)}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {s.cars}
                    {totalSpaces ? `/${totalSpaces}` : ""} cars
                    {s.fullLots.length ? ` · ${s.fullLots.length} full` : ""}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.lots.map((lot) => {
                    const rec = s.last[lot.id];
                    return (
                      <span
                        key={lot.id}
                        className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${
                          rec?.full
                            ? "border-red-500/40 text-red-400"
                            : "border-white/10 text-slate-300"
                        }`}
                      >
                        {lot.name}: {rec ? (rec.full ? "FULL" : rec.cars) : "—"}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
