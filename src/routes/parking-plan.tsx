import { createFileRoute, Link } from "@tanstack/react-router";

import { useParkingState, type LotPlan } from "@/lib/parking-lots";

export const Route = createFileRoute("/parking-plan")({
  head: () => ({
    meta: [
      { title: "Parking Plan · Kairos Command" },
      {
        name: "description",
        content:
          "Space-by-space parking plan for every lot: reserved, HPD, ministry and ADA designations so staff know who parks where.",
      },
      { property: "og:title", content: "Parking Plan · Kairos Command" },
      {
        property: "og:description",
        content:
          "Reserved, HPD, ministry and ADA space allocations for each parking lot on the property.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ParkingPlanPage,
});

const EMPTY: LotPlan = { reserved: 0, hpd: 0, ministry: 0, ada: 0 };

const FIELDS = [
  { key: "reserved" as const, label: "Reserved", color: "#eab308", who: "Staff, guests, pastoral" },
  { key: "hpd" as const, label: "HPD", color: "#38bdf8", who: "Law enforcement staging" },
  { key: "ministry" as const, label: "Ministry", color: "#a855f7", who: "Ministry team vehicles" },
  { key: "ada" as const, label: "ADA", color: "#22c55e", who: "Accessible / handicap" },
];

function ParkingPlanPage() {
  const [state, setState] = useParkingState();

  const setPlan = (lotId: string, patch: Partial<LotPlan>) =>
    setState({
      ...state,
      lots: state.lots.map((l) =>
        l.id === lotId ? { ...l, plan: { ...EMPTY, ...(l.plan ?? {}), ...patch } } : l,
      ),
    });

  const totals = FIELDS.map((f) => ({
    ...f,
    total: state.lots.reduce((a, l) => a + (l.plan?.[f.key] ?? 0), 0),
  }));
  const totalSpaces = state.lots.reduce((a, l) => a + l.spaces, 0);
  const designated = totals.reduce((a, t) => a + t.total, 0);

  return (
    <main className="min-h-screen bg-background text-white p-4 lg:p-8">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Parking Plan</h1>
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
            {state.lots.length} lots · {designated} designated of {totalSpaces || "?"} total spaces
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10"
          >
            ← Command
          </Link>
          <Link
            to="/parking-summary"
            className="px-3 py-1.5 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10"
          >
            Weekly summary
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {totals.map((t) => (
          <div key={t.key} className="bg-surface border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="size-2.5 rounded-full ring-2 ring-white/10"
                style={{ backgroundColor: t.color }}
              />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {t.label}
              </p>
            </div>
            <p className="text-2xl font-mono tabular-nums">{t.total}</p>
            <p className="text-[10px] text-slate-500 leading-snug">{t.who}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {state.lots.map((lot) => {
          const plan = { ...EMPTY, ...(lot.plan ?? {}) };
          const designatedLot = plan.reserved + plan.hpd + plan.ministry + plan.ada;
          const general = lot.spaces > 0 ? Math.max(0, lot.spaces - designatedLot) : null;
          return (
            <section key={lot.id} className="bg-surface border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="size-3 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: lot.color }}
                />
                <h2 className="text-sm font-bold">{lot.name}</h2>
                <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  {designatedLot} designated
                  {general === null ? "" : ` · ${general} general`} · {lot.spaces || "?"} total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FIELDS.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {f.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={plan[f.key]}
                      onChange={(e) => setPlan(lot.id, { [f.key]: Math.max(0, Number(e.target.value) || 0) })}
                      className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
                    />
                  </label>
                ))}
              </div>

              {designatedLot > 0 && (
                <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-white/5">
                  {FIELDS.map((f) => {
                    const base = lot.spaces > 0 ? lot.spaces : designatedLot;
                    const w = base > 0 ? (plan[f.key] / base) * 100 : 0;
                    return (
                      <div key={f.key} style={{ width: `${w}%`, backgroundColor: f.color }} />
                    );
                  })}
                </div>
              )}

              <label className="mt-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Who parks where
                </span>
                <textarea
                  rows={2}
                  value={plan.notes ?? ""}
                  placeholder="e.g. Row A reserved for pastoral staff, HPD at the north gate"
                  onChange={(e) => setPlan(lot.id, { notes: e.target.value })}
                  className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white leading-snug"
                />
              </label>
            </section>
          );
        })}
      </div>
    </main>
  );
}
