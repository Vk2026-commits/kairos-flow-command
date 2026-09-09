import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  useParkingState,
  SERVICES,
  countDate,
  fmtDate,
  toDateKey,
  type LotCount,
} from "@/lib/parking-lots";

export const Route = createFileRoute("/lots-mobile")({
  component: LotsMobile,
  head: () => ({
    meta: [
      { title: "Phone Parking Counts | Kairos Command" },
      {
        name: "description",
        content:
          "Enter Sunday service counts and real-time vehicle counts for every church parking lot from your phone.",
      },
      { property: "og:title", content: "Phone Parking Counts | Kairos Command" },
      {
        property: "og:description",
        content:
          "Mobile-friendly parking count entry for Sunday services and live counts across all lots.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function keyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
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

function lastSunday() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return keyOf(d);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtStamp(at: string) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const field =
  "w-full bg-surface-bright border border-white/10 rounded-xl px-3 py-3 text-base text-white";
const label = "text-[10px] font-bold uppercase tracking-widest text-slate-500";

function LotsMobile() {
  const [state, setState] = useParkingState();
  const [tab, setTab] = useState<"live" | "sunday">("live");

  return (
    <div className="min-h-screen bg-surface-dark text-white pb-24">
      <header className="sticky top-0 z-20 bg-surface-dark/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight">Parking counts</h1>
            <p className="truncate text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {state.lots.length} lots · phone entry
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300"
          >
            Home
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              ["live", "Live count"],
              ["sunday", "Sunday counts"],
            ] as const
          ).map(([id, name]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest border transition ${
                tab === id
                  ? "bg-kairos-blue/20 border-kairos-blue text-kairos-blue"
                  : "border-white/10 text-slate-400"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {tab === "live" ? (
          <MobileLive state={state} setState={setState} />
        ) : (
          <MobileSunday state={state} setState={setState} />
        )}
      </main>
    </div>
  );
}

type StateProps = {
  state: ReturnType<typeof useParkingState>[0];
  setState: ReturnType<typeof useParkingState>[1];
};

function MobileLive({ state, setState }: StateProps) {
  const [date, setDate] = useState(() => toDateKey(new Date().toISOString()));
  const [time, setTime] = useState(nowTime);
  const [serviceId, setServiceId] = useState<string>(SERVICES[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  const latest = useMemo(() => {
    const map: Record<string, LotCount | undefined> = {};
    for (const c of state.counts) {
      const cur = map[c.lotId];
      if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) map[c.lotId] = c;
    }
    return map;
  }, [state.counts]);

  const stampAt = () => {
    const [y, mo, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const at = new Date();
    if (y && mo && d) at.setFullYear(y, mo - 1, d);
    at.setHours(Number.isFinite(h) ? h : at.getHours(), Number.isFinite(mi) ? mi : 0, 0, 0);
    return at.toISOString();
  };

  const submit = (lotId: string, full: boolean) => {
    const lot = state.lots.find((l) => l.id === lotId);
    if (!lot) return;
    const raw = drafts[lotId];
    const value =
      full && (raw === undefined || raw.trim() === "")
        ? lot.spaces
        : Math.max(0, Math.floor(Number(raw) || 0));
    const entry: LotCount = {
      id: `${lot.id}-m-${Date.now()}`,
      lotId: lot.id,
      serviceId,
      date,
      at: stampAt(),
      cars: value,
      full: full || (lot.spaces > 0 && value >= lot.spaces),
      note: note.trim() || undefined,
    };
    setState({ ...state, counts: [entry, ...state.counts].slice(0, 4000) });
    setDrafts((p) => ({ ...p, [lotId]: "" }));
    setFlash(`${lot.name}: ${full ? "marked full" : `${value} cars`} saved`);
    window.setTimeout(() => setFlash(""), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={label}>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          </label>
        </div>
        <div>
          <span className={label}>Service</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setServiceId(s.id);
                  setTime(s.time);
                }}
                className={`rounded-xl px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest border ${
                  s.id === serviceId
                    ? "bg-kairos-blue/20 border-kairos-blue text-kairos-blue"
                    : "border-white/10 text-slate-400"
                }`}
              >
                {s.name.replace(" Service", "")}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className={label}>Note (optional)</span>
          <input
            value={note}
            placeholder="e.g. overflow started"
            onChange={(e) => setNote(e.target.value)}
            className={field}
          />
        </label>
        <button
          onClick={() => {
            setDate(toDateKey(new Date().toISOString()));
            setTime(nowTime());
          }}
          className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300"
        >
          Use right now
        </button>
      </div>

      {flash && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">{flash}</p>
      )}

      <div className="space-y-3">
        {state.lots.map((lot) => {
          const last = latest[lot.id];
          const pct = lot.spaces > 0 && last ? Math.min(100, (last.cars / lot.spaces) * 100) : 0;
          return (
            <div key={lot.id} className="bg-surface border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: lot.color }}
                  />
                  <span className="truncate text-sm font-bold">{lot.name}</span>
                </div>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  {last ? `${last.cars}/${lot.spaces || "?"}` : `0/${lot.spaces || "?"}`}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: lot.color }}
                />
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Cars now"
                  value={drafts[lot.id] ?? ""}
                  onChange={(e) => setDrafts((p) => ({ ...p, [lot.id]: e.target.value }))}
                  className={`${field} text-center font-mono text-lg tabular-nums`}
                />
                <button
                  onClick={() => submit(lot.id, false)}
                  className="shrink-0 rounded-xl bg-kairos-blue/20 border border-kairos-blue px-4 text-[11px] font-bold uppercase tracking-widest text-kairos-blue"
                >
                  Save
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((step) => (
                  <button
                    key={step}
                    onClick={() =>
                      setDrafts((p) => ({
                        ...p,
                        [lot.id]: String(Math.max(0, Number(p[lot.id] || 0) + step)),
                      }))
                    }
                    className="rounded-xl border border-white/10 py-2.5 text-[11px] font-mono text-slate-300"
                  >
                    +{step}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDrafts((p) => ({ ...p, [lot.id]: "" }))}
                  className="rounded-xl border border-white/10 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Clear
                </button>
                <button
                  onClick={() => submit(lot.id, true)}
                  className="rounded-xl bg-red-500/10 border border-red-500/30 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-400"
                >
                  Mark full
                </button>
              </div>

              {last && (
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Last: {last.full ? "FULL" : `${last.cars} cars`} · {fmtStamp(last.at)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileSunday({ state, setState }: StateProps) {
  const [sunday, setSunday] = useState<string>(lastSunday);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const cell = (lotId: string, sid: string) => `${lotId}|${sid}`;

  const recorded = useMemo(() => {
    const bucket: Record<string, LotCount> = {};
    for (const c of state.counts) {
      if (countDate(c) !== sunday) continue;
      const k = cell(c.lotId, c.serviceId ?? SERVICES[0].id);
      const cur = bucket[k];
      if (!cur || new Date(c.at).getTime() > new Date(cur.at).getTime()) bucket[k] = c;
    }
    return bucket;
  }, [state.counts, sunday]);

  const entered = Object.values(draft).filter((v) => v !== "" && v !== undefined).length;

  const loadSaved = () => {
    const next: Record<string, string> = {};
    for (const lot of state.lots)
      for (const s of SERVICES) {
        const rec = recorded[cell(lot.id, s.id)];
        if (rec) next[cell(lot.id, s.id)] = String(rec.cars);
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
          id: `${lot.id}-${s.id}-m${stamp}-${li}${si}`,
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

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-white/5 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
          {fmtDate(sunday)} · {entered} entered
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              setSunday(shiftSunday(sunday, -1));
              setDraft({});
              setSaved(false);
            }}
            className="rounded-xl border border-white/10 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-300"
          >
            ‹ Prev
          </button>
          <input
            type="date"
            value={sunday}
            onChange={(e) => {
              if (!e.target.value) return;
              const d = parseKey(e.target.value);
              d.setDate(d.getDate() - d.getDay());
              setSunday(keyOf(d));
              setDraft({});
              setSaved(false);
            }}
            className={field}
          />
          <button
            onClick={() => {
              setSunday(shiftSunday(sunday, 1));
              setDraft({});
              setSaved(false);
            }}
            className="rounded-xl border border-white/10 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-300"
          >
            Next ›
          </button>
        </div>
        <button
          onClick={loadSaved}
          className="w-full rounded-xl border border-white/10 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300"
        >
          Load saved counts
        </button>
      </div>

      <div className="space-y-3">
        {state.lots.map((lot) => (
          <div key={lot.id} className="bg-surface border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
                style={{ backgroundColor: lot.color }}
              />
              <span className="truncate text-sm font-bold">{lot.name}</span>
              {lot.spaces ? (
                <span className="shrink-0 text-[10px] font-mono text-slate-500">
                  /{lot.spaces}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SERVICES.map((s) => {
                const k = cell(lot.id, s.id);
                const rec = recorded[k];
                return (
                  <label key={s.id} className="flex flex-col gap-1">
                    <span className={label}>{s.name.replace(" Service", "")}</span>
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
                      className={`${field} text-center font-mono tabular-nums`}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4">
        <button
          onClick={saveWeek}
          disabled={entered === 0}
          className="w-full rounded-2xl bg-white py-4 text-xs font-bold uppercase tracking-widest text-slate-900 disabled:opacity-40"
        >
          {saved ? "Saved ✓" : `Save Sunday (${entered})`}
        </button>
      </div>
    </div>
  );
}
