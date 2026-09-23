import { useState } from "react";
import type { ConsultingRecord, EntityKey } from "@/lib/consulting";
import { hoursBetween } from "@/lib/consulting";
import Dictate, { appendSpoken } from "./Dictate";

/**
 * Quick daily hours entry for the Executive Dashboard. Supervisors log the
 * real start/end times (or a plain total) for a day; the entry saves to the
 * Work Activity log and counts toward Total Recorded Hours only when marked
 * "Recorded". Nothing is estimated or invented — the person entering it sets
 * the time status.
 */

const card = "rounded-2xl border border-white/5 bg-surface p-5";
const inputCls =
  "w-full px-3 py-2 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1";
const btnPrimary =
  "px-3 py-2 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold uppercase tracking-wider transition disabled:opacity-40";
const btnGhost =
  "px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition";

type Save = (entity: EntityKey, id: string | null, record: Partial<ConsultingRecord>) => Promise<void> | void;

const TIME_OPTIONS = ["Recorded", "Estimated", "Pending Verification"] as const;

export default function QuickHours({ canEdit, onSave }: { canEdit: boolean; onSave: Save }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [total, setTotal] = useState("");
  const [timeStatus, setTimeStatus] = useState<(typeof TIME_OPTIONS)[number]>("Recorded");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!canEdit) return null;

  const fromTimes = hoursBetween(start, end);
  const explicit = Number(total);
  const hours = fromTimes > 0 ? fromTimes : Number.isFinite(explicit) && explicit > 0 ? Math.round(explicit * 100) / 100 : 0;

  const reset = () => {
    setTitle("");
    setStart("");
    setEnd("");
    setTotal("");
    setNotes("");
    setTimeStatus("Recorded");
    setErr(null);
  };

  const submit = async () => {
    if (!title.trim()) return setErr("Add a short description of the work.");
    if (hours <= 0) return setErr("Enter a start and end time, or a total number of hours.");
    setErr(null);
    setBusy(true);
    try {
      await onSave("activities", null, {
        title: title.trim(),
        status: "Completed",
        occurred_on: date,
        data: {
          timeStatus,
          ...(start ? { startTime: start } : {}),
          ...(end ? { endTime: end } : {}),
          ...(fromTimes <= 0 && explicit > 0 ? { hours: Math.round(explicit * 100) / 100 } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      } as Partial<ConsultingRecord>);
      reset();
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e) {
      setErr((e as Error).message || "Could not save those hours");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Log Hours</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Enter each day's real hours — only time you mark "Recorded" counts toward Total Recorded Hours.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {done && <span className="text-[11px] font-semibold text-emerald-400">Saved — dashboard total updated.</span>}
          <button type="button" onClick={() => setOpen((o) => !o)} className={open ? btnGhost : btnPrimary}>
            {open ? "Close" : "+ Log Hours"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>What did you work on?</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunday parking assessment and implementation"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>— or Total Hours</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="e.g. 7.5"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Time Status</label>
              <select
                value={timeStatus}
                onChange={(e) => setTimeStatus(e.target.value as (typeof TIME_OPTIONS)[number])}
                className={inputCls}
              >
                {TIME_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Notes (optional)</label>
              <Dictate onText={(t) => setNotes((prev) => appendSpoken(prev, t))} />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything worth remembering about this time…"
              className={inputCls}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={submit} disabled={busy || hours <= 0} className={btnPrimary}>
              {busy ? "Saving…" : `Save ${hours > 0 ? `${hours}h` : ""} — ${timeStatus}`}
            </button>
            {hours > 0 && (
              <span className="text-[11px] text-slate-400">
                {hours} hour{hours === 1 ? "" : "s"} ·{" "}
                {timeStatus === "Recorded"
                  ? "counts toward Total Recorded Hours"
                  : timeStatus === "Estimated"
                    ? "shown separately as Estimated Hours"
                    : "held for verification — not counted yet"}
              </span>
            )}
            {err && <span className="text-[11px] text-red-400">{err}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
