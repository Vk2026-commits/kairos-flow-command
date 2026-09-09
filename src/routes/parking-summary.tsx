import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SERVICES,
  countDate,
  fmtDate,
  serviceName,
  useParkingState,
  type LotCount,
  type ParkingState,
} from "@/lib/parking-lots";

export const Route = createFileRoute("/parking-summary")({
  head: () => ({
    meta: [
      { title: "Weekly Parking Summary | Kairos Command" },
      {
        name: "description",
        content:
          "Week-by-week parking occupancy totals and trends for every lot since September 6, with a downloadable executive PDF.",
      },
      { property: "og:title", content: "Weekly Parking Summary | Kairos Command" },
      {
        property: "og:description",
        content:
          "Week-by-week parking occupancy totals and trends for every lot since September 6.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParkingSummaryPage,
});

/** first tracked week: the Sunday of Sep 6, 2026 */
const START_KEY = "2026-09-06";

function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

function keyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Sunday that begins the week containing this date */
function weekStart(key: string) {
  const d = parseKey(key);
  d.setDate(d.getDate() - d.getDay());
  return keyOf(d);
}

function weekLabel(start: string) {
  const a = parseKey(start);
  const b = new Date(a);
  b.setDate(b.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(a)} – ${f(b)}, ${b.getFullYear()}`;
}

type Session = { date: string; sid: string; last: Record<string, LotCount> };

function buildWeeks(state: ParkingState) {
  const sessions: Record<string, Session> = {};
  for (const c of state.counts) {
    const date = countDate(c);
    if (!date || date < START_KEY) continue;
    const sid = c.serviceId ?? SERVICES[0].id;
    const key = `${date}|${sid}`;
    const s = (sessions[key] ||= { date, sid, last: {} });
    const cur = s.last[c.lotId];
    if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) s.last[c.lotId] = c;
  }

  const groups: Record<string, Session[]> = {};
  for (const s of Object.values(sessions)) {
    (groups[weekStart(s.date)] ||= []).push(s);
  }

  return Object.entries(groups)
    .map(([start, list]) => {
      list.sort((a, b) => (a.date === b.date ? a.sid.localeCompare(b.sid) : a.date.localeCompare(b.date)));
      const perLot = state.lots.map((lot) => {
        const recs = list.map((s) => s.last[lot.id]).filter(Boolean) as LotCount[];
        const cars = recs.reduce((a, r) => a + r.cars, 0);
        const peak = recs.reduce((a, r) => Math.max(a, r.cars), 0);
        const avg = recs.length ? Math.round(cars / recs.length) : 0;
        const fulls = recs.filter((r) => r.full).length;
        const fillPct = lot.spaces ? Math.min(100, Math.round((avg / lot.spaces) * 100)) : 0;
        return { lot, observations: recs.length, cars, peak, avg, fulls, fillPct };
      });
      const totalCars = perLot.reduce((a, p) => a + p.cars, 0);
      const totalFulls = perLot.reduce((a, p) => a + p.fulls, 0);
      const busiest = list.reduce<{ label: string; cars: number }>(
        (best, s) => {
          const cars = Object.values(s.last).reduce((a, r) => a + r.cars, 0);
          return cars > best.cars
            ? { cars, label: `${fmtDate(s.date)} · ${serviceName(s.sid)}` }
            : best;
        },
        { label: "—", cars: 0 },
      );
      return { start, label: weekLabel(start), sessions: list, perLot, totalCars, totalFulls, busiest };
    })
    .sort((a, b) => b.start.localeCompare(a.start));
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-500">—</span>;
  if (value === 0) return <span className="text-slate-400">±0</span>;
  const up = value > 0;
  return (
    <span className={up ? "text-amber-400" : "text-emerald-400"}>
      {up ? "▲" : "▼"} {Math.abs(value)}
    </span>
  );
}

function ParkingSummaryPage() {
  const [state] = useParkingState();
  const weeks = useMemo(() => buildWeeks(state), [state]);
  const [idx, setIdx] = useState(0);
  const week = weeks[idx];
  const prior = weeks[idx + 1];
  const totalSpaces = state.lots.reduce((a, l) => a + l.spaces, 0);
  const [busy, setBusy] = useState(false);

  // Counts submitted from a phone arrive through the live sync in
  // useParkingState; stamp the moment this page last took new numbers in.
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    setUpdatedAt(
      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    );
  }, [state]);

  const lotDelta = (lotId: string, cars: number) => {
    if (!prior) return null;
    const p = prior.perLot.find((x) => x.lot.id === lotId);
    if (!p || p.observations === 0) return null;
    return cars - p.cars;
  };

  const downloadPdf = async () => {
    if (!week) return;
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const M = 48;
      let y = M;
      const W = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, W, 76, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold").setFontSize(16);
      doc.text("Weekly Parking Summary", M, 40);
      doc.setFont("helvetica", "normal").setFontSize(10);
      doc.text(`${week.label} · Kairos Command`, M, 58);
      y = 110;

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      const facts = [
        `Services recorded: ${week.sessions.length}`,
        `Total observed occupancy: ${week.totalCars} cars`,
        `Total capacity across lots: ${totalSpaces || "not set"}`,
        `Lot-full events: ${week.totalFulls}`,
        `Busiest service: ${week.busiest.label} (${week.busiest.cars} cars)`,
        prior
          ? `Change vs ${prior.label}: ${week.totalCars - prior.totalCars >= 0 ? "+" : ""}${
              week.totalCars - prior.totalCars
            } cars`
          : "Change vs prior week: first tracked week",
      ];
      for (const line of facts) {
        doc.text(line, M, y);
        y += 16;
      }
      y += 12;

      const cols = [M, M + 150, M + 235, M + 300, M + 360, M + 425, M + 490];
      const head = ["Lot", "Observations", "Total", "Avg", "Peak", "Avg fill", "Trend"];
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.setFillColor(241, 245, 249);
      doc.rect(M - 6, y - 12, W - 2 * M + 12, 20, "F");
      head.forEach((h, i) => doc.text(h, cols[i], y + 2));
      y += 24;
      doc.setFont("helvetica", "normal");

      for (const p of week.perLot) {
        const d = lotDelta(p.lot.id, p.cars);
        const row = [
          p.lot.name,
          String(p.observations),
          String(p.cars),
          String(p.avg),
          `${p.peak}${p.lot.spaces ? `/${p.lot.spaces}` : ""}`,
          p.lot.spaces ? `${p.fillPct}%` : "—",
          d === null ? "—" : `${d > 0 ? "+" : ""}${d}`,
        ];
        row.forEach((t, i) => doc.text(t, cols[i], y));
        y += 16;
        if (y > 700) {
          doc.addPage();
          y = M;
        }
      }

      y += 18;
      doc.setFont("helvetica", "bold").setFontSize(10);
      doc.text("Services this week", M, y);
      y += 16;
      doc.setFont("helvetica", "normal").setFontSize(9);
      for (const s of week.sessions) {
        const cars = Object.values(s.last).reduce((a, r) => a + r.cars, 0);
        const full = Object.values(s.last).filter((r) => r.full).length;
        doc.text(
          `${fmtDate(s.date)} · ${serviceName(s.sid)} — ${cars} cars${full ? `, ${full} lot(s) full` : ""}`,
          M,
          y,
        );
        y += 14;
        if (y > 720) {
          doc.addPage();
          y = M;
        }
      }

      doc.save(`parking-summary-${week.start}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="max-w-6xl mx-auto p-5 lg:p-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <Link
              to="/"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white"
            >
              ← Command center
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Weekly Parking Summary</h1>
            <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
              Tracked since {fmtDate(START_KEY)} · {weeks.length} week
              {weeks.length === 1 ? "" : "s"} recorded
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                Live{updatedAt ? ` · updated ${updatedAt}` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            {weeks.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Week
                </span>
                <select
                  value={idx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {weeks.map((w, i) => (
                    <option key={w.start} value={i}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!week || busy}
              className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white text-slate-900 disabled:opacity-40"
            >
              {busy ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        {!week ? (
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <p className="text-sm text-slate-400">
              No parking counts have been recorded since {fmtDate(START_KEY)} yet. Record counts on
              the Parking Lots tab and they will roll up here week by week.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Services recorded", value: String(week.sessions.length) },
                {
                  label: "Observed occupancy",
                  value: String(week.totalCars),
                  sub: totalSpaces ? `capacity ${totalSpaces}` : "",
                },
                {
                  label: "Change vs prior week",
                  value: prior
                    ? `${week.totalCars - prior.totalCars >= 0 ? "+" : ""}${
                        week.totalCars - prior.totalCars
                      }`
                    : "—",
                  sub: prior ? prior.label : "first tracked week",
                },
                { label: "Lot-full events", value: String(week.totalFulls) },
              ].map((k) => (
                <div key={k.label} className="bg-surface border border-white/5 rounded-2xl p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {k.label}
                  </p>
                  <p className="text-xl font-mono text-white tabular-nums">{k.value}</p>
                  {k.sub && <p className="text-[10px] text-slate-500">{k.sub}</p>}
                </div>
              ))}
            </div>

            <div className="bg-surface border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-1">
                Occupancy by lot · {week.label}
              </h2>
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-4">
                Busiest service: {week.busiest.label} ({week.busiest.cars} cars)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="py-2 pr-3">Lot</th>
                      <th className="py-2 pr-3">Obs.</th>
                      <th className="py-2 pr-3">Total cars</th>
                      <th className="py-2 pr-3">Avg</th>
                      <th className="py-2 pr-3">Peak</th>
                      <th className="py-2 pr-3">Avg fill</th>
                      <th className="py-2 pr-3">Full</th>
                      <th className="py-2 pr-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {week.perLot.map((p) => (
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
                        <td className="py-2 pr-3 font-mono text-slate-400 tabular-nums">
                          {p.observations}
                        </td>
                        <td className="py-2 pr-3 font-mono text-white tabular-nums">{p.cars}</td>
                        <td className="py-2 pr-3 font-mono text-slate-300 tabular-nums">{p.avg}</td>
                        <td className="py-2 pr-3 font-mono text-slate-300 tabular-nums">
                          {p.peak}
                          {p.lot.spaces ? `/${p.lot.spaces}` : ""}
                        </td>
                        <td className="py-2 pr-3 font-mono text-slate-300 tabular-nums">
                          {p.lot.spaces ? `${p.fillPct}%` : "—"}
                        </td>
                        <td className="py-2 pr-3 font-mono tabular-nums">
                          {p.fulls ? <span className="text-red-400">{p.fulls}</span> : "0"}
                        </td>
                        <td className="py-2 pr-3 font-mono tabular-nums">
                          <Delta value={lotDelta(p.lot.id, p.cars)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3">
                Week-over-week totals
              </h2>
              <div className="space-y-2">
                {weeks
                  .slice()
                  .reverse()
                  .map((w, i, arr) => {
                    const max = Math.max(1, ...arr.map((x) => x.totalCars));
                    const prev = arr[i - 1];
                    const d = prev ? w.totalCars - prev.totalCars : null;
                    return (
                      <div key={w.start} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-[11px] font-mono text-slate-400">
                          {w.label}
                        </span>
                        <span className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                          <span
                            className="block h-full rounded-full bg-white/60"
                            style={{ width: `${(w.totalCars / max) * 100}%` }}
                          />
                        </span>
                        <span className="w-16 text-right text-[11px] font-mono text-white tabular-nums">
                          {w.totalCars}
                        </span>
                        <span className="w-16 text-right text-[11px] font-mono">
                          <Delta value={d} />
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-surface border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3">
                Services this week
              </h2>
              <div className="space-y-2">
                {week.sessions.map((s) => {
                  const cars = Object.values(s.last).reduce((a, r) => a + r.cars, 0);
                  const full = Object.values(s.last).filter((r) => r.full).length;
                  return (
                    <p key={`${s.date}-${s.sid}`} className="text-[11px] font-mono text-slate-400">
                      <span className="text-white font-bold">{fmtDate(s.date)}</span> ·{" "}
                      {serviceName(s.sid)} — {cars} cars
                      {full ? ` · ${full} lot(s) full` : ""}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
