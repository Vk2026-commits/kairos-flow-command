import { useEffect, useState } from "react";

import {
  serviceLabelFromTime,
  servicesOf,
  type ChurchService,
  type ParkingState,
} from "@/lib/parking-lots";

type Props = {
  state: ParkingState;
  setState: (next: ParkingState) => void;
};

type Draft = ChurchService & { key: string };

function toDraft(services: ChurchService[]): Draft[] {
  return services.map((s, i) => ({ ...s, key: `${s.id}-${i}` }));
}

/**
 * Each client sets their own service times. Everything else in the parking
 * tools (count sheets, weekly summary, phone view, reports) reads these.
 */
export function ServiceTimesEditor({ state, setState }: Props) {
  const services = servicesOf(state);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Draft[]>(() => toDraft(services));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) setRows(toDraft(servicesOf(state)));
  }, [open, state]);

  const setRow = (key: string, patch: Partial<Draft>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    const stamp = Date.now();
    setRows((prev) => [
      ...prev,
      { key: `new-${stamp}`, id: `svc-${stamp}`, time: "09:00", name: "" },
    ]);
    setSaved(false);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setSaved(false);
  };

  const save = () => {
    const cleaned: ChurchService[] = rows
      .filter((r) => /^\d{1,2}:\d{2}$/.test(r.time))
      .map((r) => ({
        id: r.id,
        time: r.time,
        name: r.name.trim() || serviceLabelFromTime(r.time),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
    if (cleaned.length === 0) {
      window.alert("Add at least one service time.");
      return;
    }
    setState({ ...state, services: cleaned });
    setSaved(true);
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setSaved(false);
        }}
        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-white/10 rounded-lg px-3 py-1.5 hover:text-white hover:bg-white/5 transition"
      >
        {open ? "Close service times" : `⚙ Service times (${services.length})`}
      </button>

      {open && (
        <div className="mt-3 bg-surface border border-white/10 rounded-2xl p-4">
          <p className="text-[11px] text-slate-500 mb-3">
            Set this client&apos;s service times. Counts already recorded keep the service they
            were saved under.
          </p>
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={r.key} className="flex items-end gap-3 flex-wrap">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Start time
                  </span>
                  <input
                    type="time"
                    value={r.time}
                    onChange={(e) => {
                      const time = e.target.value;
                      const auto = !r.name.trim() || r.name === serviceLabelFromTime(r.time);
                      setRow(r.key, auto ? { time, name: serviceLabelFromTime(time) } : { time });
                      setSaved(false);
                    }}
                    className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 flex-1 min-w-48">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Name shown in the app
                  </span>
                  <input
                    value={r.name}
                    placeholder={serviceLabelFromTime(r.time)}
                    onChange={(e) => {
                      setRow(r.key, { name: e.target.value });
                      setSaved(false);
                    }}
                    className="bg-surface-bright border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </label>
                <button
                  onClick={() => removeRow(r.key)}
                  disabled={rows.length <= 1}
                  className="px-3 py-2 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-300 hover:border-red-400/40 disabled:opacity-30"
                >
                  Remove
                </button>
                <span className="sr-only">Service {i + 1}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={addRow}
              className="px-4 py-2 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:bg-white/10"
            >
              + Add service
            </button>
            <button
              onClick={save}
              className="px-5 py-2.5 rounded-lg bg-kairos-blue/20 border border-kairos-blue text-[10px] font-bold uppercase tracking-widest text-kairos-blue hover:bg-kairos-blue/30 transition"
            >
              {saved ? "Saved ✓" : "Save service times"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
