import { useMemo, useState } from "react";
import Dictate, { appendSpoken } from "./Dictate";
import {
  DIRECTOR_CATEGORIES,
  TIME_STATUSES,
  ACTIVITY_STATUSES,
  PRIORITIES,
  estimatedHours,
  fmtDay,
  recordedHours,
  statusTone,
  timeStatusLabel,
  toCsv,
  type ConsultingRecord,
  type EntityKey,
} from "@/lib/consulting";

// Director of Security activity, operations & accountability views. These sit
// inside the existing Consulting Progress screen and reuse its records — an
// activity is entered once and every view below reads from that same entry.

type Records = Record<EntityKey, ConsultingRecord[]>;
type SaveRecord = (entity: EntityKey, id: string | null, record: Partial<ConsultingRecord>) => void;

const card = "rounded-2xl border border-white/5 bg-surface p-5";
const inputCls =
  "w-full h-9 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1";
const btnPrimary =
  "px-3 py-2 rounded-lg bg-kairos-blue text-white text-xs font-semibold uppercase tracking-wider transition disabled:opacity-40";
const btnGhost =
  "px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-bg-deep px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${tone ?? "text-white"}`}>{value}</div>
    </div>
  );
}

const catOf = (r: ConsultingRecord) => String(r.data?.category ?? r.data?.activityType ?? "Other");
const locOf = (r: ConsultingRecord) => String(r.data?.location ?? "");

/* ===================== Director metrics (dashboard) ===================== */

export function DirectorMetrics({ records }: { records: Records }) {
  const acts = records.activities;
  const month = today().slice(0, 7);
  const inMonth = acts.filter((a) => String(a.occurred_on ?? "").startsWith(month));
  const completed = acts.filter((a) => /completed|implemented|verified/i.test(a.status));
  const rec = acts.reduce((s, a) => s + recordedHours(a), 0);
  const est = acts.reduce((s, a) => s + estimatedHours(a), 0);
  const monthRec = inMonth.reduce((s, a) => s + recordedHours(a), 0);
  const byCat = (needle: RegExp) => acts.filter((a) => needle.test(catOf(a))).length;

  return (
    <div className={card}>
      <h3 className="text-sm font-bold uppercase tracking-widest text-white">
        Director of Security — Activity &amp; Accountability
      </h3>
      <p className="mt-1 text-xs text-slate-400">
        Recorded hours are verified time. Estimated hours are shown separately and never counted as verified.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total Activities" value={String(acts.length)} />
        <Stat label="Activities This Month" value={String(inMonth.length)} />
        <Stat label="Completed Activities" value={String(completed.length)} />
        <Stat label="Open Activities" value={String(acts.length - completed.length)} />
        <Stat label="Total Recorded Hours" value={rec.toFixed(2)} tone="text-kairos-gold" />
        <Stat label="Total Estimated Hours" value={est.toFixed(2)} tone="text-sky-300" />
        <Stat label="Recorded Hours This Month" value={monthRec.toFixed(2)} />
        <Stat label="Investigations Completed" value={String(acts.filter((a) => /investigation/i.test(catOf(a)) && /completed/i.test(a.status)).length)} />
        <Stat label="Incidents Managed" value={String(byCat(/incident|emergency response/i))} />
        <Stat label="Policies / SOPs Developed" value={String(byCat(/policy|sop/i))} />
        <Stat label="Training Activities" value={String(byCat(/training|team management/i))} />
        <Stat label="Security Technology Projects" value={String(byCat(/technology|cctv|visitor management|access control|communications/i))} />
        <Stat label="Executive Protection Activities" value={String(byCat(/executive protection/i))} />
        <Stat label="Emergency Preparedness" value={String(byCat(/preparedness|weather/i))} />
        <Stat label="Site Visits" value={String(records.siteVisits.length)} />
        <Stat label="Recommendations Pending" value={String(records.recommendations.filter((r) => !/implemented|verified/i.test(r.status)).length)} />
        <Stat label="Action Items Pending" value={String(records.actionItems.filter((a) => a.status !== "Completed").length)} />
        <Stat label="Not Recorded Time Entries" value={String(acts.filter((a) => timeStatusLabel(a) === "Not Recorded").length)} />
      </div>
    </div>
  );
}

/* ===================== Quick activity entry ===================== */

export function QuickLogActivity({ onSave }: { onSave: SaveRecord }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    date: today(),
    title: "",
    category: "Security Operations",
    location: "",
    description: "",
    startTime: "",
    endTime: "",
    hours: "",
    timeStatus: "Recorded",
    coordinatedWith: "",
    status: "Completed",
    followUp: false,
    followUpDate: "",
    followUpOwner: "",
    followUpPriority: "Normal",
    recommendation: "",
    outcome: "",
    addNote: true,
  });
  const set = (patch: Partial<typeof f>) => setF((cur) => ({ ...cur, ...patch }));

  const submit = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    try {
      const hours = Number(f.hours);
      const isEstimated = f.timeStatus === "Estimated";
      onSave("activities", null, {
        title: f.title.trim(),
        status: f.status,
        occurred_on: f.date,
        data: {
          activityType: "Other",
          category: f.category,
          location: f.location,
          startTime: f.startTime,
          endTime: f.endTime,
          hours: !isEstimated && Number.isFinite(hours) && hours > 0 ? hours : "",
          estimatedHours: isEstimated && Number.isFinite(hours) && hours > 0 ? hours : "",
          timeStatus: f.timeStatus,
          coordinatedWith: f.coordinatedWith,
          notes: f.description,
          outcome: f.outcome,
          recommendations: f.recommendation,
          followUp: f.followUp ? "Yes" : "",
          followUpDate: f.followUpDate,
        },
      });

      if (f.followUp) {
        onSave("actionItems", null, {
          title: `Follow-up: ${f.title.trim()}`,
          status: "Not Started",
          occurred_on: f.followUpDate || null,
          data: {
            priority: f.followUpPriority === "Normal" ? "Medium" : f.followUpPriority,
            owner: f.followUpOwner,
            assignedTo: f.followUpOwner,
            relatedArea: f.location,
            description: f.description,
            notes: `Generated from activity on ${f.date}: ${f.title.trim()}`,
          },
        });
      }

      if (f.recommendation.trim()) {
        onSave("recommendations", null, {
          title: f.recommendation.trim().slice(0, 120),
          status: "Recommended",
          occurred_on: f.date,
          data: {
            priority: "Medium",
            location: f.location,
            problem: f.description,
            solution: f.recommendation,
            notes: `From activity: ${f.title.trim()}`,
          },
        });
      }

      if (f.addNote) {
        onSave("notes", null, {
          title: f.title.trim(),
          status: "Executive Leadership",
          occurred_on: f.date,
          data: {
            category: "Daily Note",
            content: [f.description, f.outcome && `Outcome: ${f.outcome}`, f.coordinatedWith && `Coordinated with: ${f.coordinatedWith}`]
              .filter(Boolean)
              .join("\n\n"),
          },
        });
      }

      setOpen(false);
      setF({ ...f, title: "", description: "", outcome: "", recommendation: "", hours: "", startTime: "", endTime: "", followUp: false, followUpDate: "" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-kairos-gold px-4 py-3 text-sm font-bold uppercase tracking-wider text-bg-deep sm:w-auto"
      >
        + Log Director Activity
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm">
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-white/10 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Log Director Activity</h3>
          <button type="button" onClick={() => setOpen(false)} className={btnGhost}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Date</span>
            <input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Category</span>
            <select value={f.category} onChange={(e) => set({ category: e.target.value })} className={inputCls}>
              {DIRECTOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>What did I do?</span>
            <input
              value={f.title}
              onChange={(e) => set({ title: e.target.value })}
              className={inputCls}
              placeholder="Sunday security operations"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Where?</span>
            <input value={f.location} onChange={(e) => set({ location: e.target.value })} className={inputCls} placeholder="Main Campus" />
          </label>
          <label className="block">
            <span className={labelCls}>Who did I coordinate with?</span>
            <input
              value={f.coordinatedWith}
              onChange={(e) => set({ coordinatedWith: e.target.value })}
              className={inputCls}
              placeholder="HPD, security officers, IT"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Start Time</span>
            <input type="time" value={f.startTime} onChange={(e) => set({ startTime: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>End Time</span>
            <input type="time" value={f.endTime} onChange={(e) => set({ endTime: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>How long did it take? (hours)</span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={f.hours}
              onChange={(e) => set({ hours: e.target.value })}
              className={inputCls}
              placeholder="1.5"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Time Status</span>
            <select value={f.timeStatus} onChange={(e) => set({ timeStatus: e.target.value })} className={inputCls}>
              {TIME_STATUSES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <div className="block sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={labelCls}>Detailed Notes / Description</span>
              <Dictate onText={(t) => set({ description: appendSpoken(f.description, t) })} />
            </div>
            <textarea
              rows={3}
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
              className={`${inputCls} h-auto py-2`}
            />
          </div>
          <div className="block sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={labelCls}>What was accomplished?</span>
              <Dictate onText={(t) => set({ outcome: appendSpoken(f.outcome, t) })} />
            </div>
            <textarea rows={2} value={f.outcome} onChange={(e) => set({ outcome: e.target.value })} className={`${inputCls} h-auto py-2`} />
          </div>
          <label className="block">
            <span className={labelCls}>Status</span>
            <select value={f.status} onChange={(e) => set({ status: e.target.value })} className={inputCls}>
              {ACTIVITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-xs text-slate-300">
            <input type="checkbox" checked={f.followUp} onChange={(e) => set({ followUp: e.target.checked })} className="size-4" />
            Follow-up required (creates an action item)
          </label>
          {f.followUp && (
            <>
              <label className="block">
                <span className={labelCls}>Follow-Up Date</span>
                <input type="date" value={f.followUpDate} onChange={(e) => set({ followUpDate: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Assigned To</span>
                <input value={f.followUpOwner} onChange={(e) => set({ followUpOwner: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Priority</span>
                <select value={f.followUpPriority} onChange={(e) => set({ followUpPriority: e.target.value })} className={inputCls}>
                  {["Low", "Normal", ...PRIORITIES.filter((p) => p !== "Low")].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <div className="block sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={labelCls}>Recommendation (optional — creates a recommendation record)</span>
              <Dictate onText={(t) => set({ recommendation: appendSpoken(f.recommendation, t) })} />
            </div>
            <textarea
              rows={2}
              value={f.recommendation}
              onChange={(e) => set({ recommendation: e.target.value })}
              className={`${inputCls} h-auto py-2`}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={f.addNote} onChange={(e) => set({ addNote: e.target.checked })} className="size-4" />
            Also add to Progress Notes
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={submit} disabled={saving || !f.title.trim()} className={btnPrimary}>
            {saving ? "Saving…" : "Save activity"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={btnGhost}>
            Cancel
          </button>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          One entry updates the Executive Dashboard, Work Activity, Timeline, Hours &amp; History, Progress Notes, Action
          Items and the Executive Report.
        </p>
      </div>
    </div>
  );
}

/* ===================== Director hours ledger ===================== */

const GROUPINGS = ["Day", "Week", "Month", "Category", "Location", "Status"] as const;

function weekKey(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return `Week of ${dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function DirectorLedger({
  activities,
  canEdit,
  onSave,
}: {
  activities: ConsultingRecord[];
  canEdit: boolean;
  onSave: SaveRecord;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState("");
  const [group, setGroup] = useState<(typeof GROUPINGS)[number]>("Month");

  const rows = useMemo(
    () =>
      activities
        .filter((a) => {
          const d = a.occurred_on ?? "";
          if (from && d < from) return false;
          if (to && d > to) return false;
          if (cat && catOf(a) !== cat) return false;
          return true;
        })
        .sort((a, b) => String(b.occurred_on ?? "").localeCompare(String(a.occurred_on ?? ""))),
    [activities, from, to, cat],
  );

  const totalRec = rows.reduce((s, a) => s + recordedHours(a), 0);
  const totalEst = rows.reduce((s, a) => s + estimatedHours(a), 0);

  const groups = useMemo(() => {
    const key = (a: ConsultingRecord) => {
      const d = a.occurred_on ?? "—";
      if (group === "Day") return fmtDay(d);
      if (group === "Week") return weekKey(d);
      if (group === "Month") return d.slice(0, 7);
      if (group === "Category") return catOf(a);
      if (group === "Location") return locOf(a) || "—";
      return a.status;
    };
    const m = new Map<string, { rec: number; est: number; count: number }>();
    rows.forEach((a) => {
      const k = key(a);
      const cur = m.get(k) ?? { rec: 0, est: 0, count: 0 };
      cur.rec += recordedHours(a);
      cur.est += estimatedHours(a);
      cur.count += 1;
      m.set(k, cur);
    });
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows, group]);

  // Monthly hours by category, drawn as simple bars.
  const chart = useMemo(() => {
    const months = new Map<string, Map<string, number>>();
    rows.forEach((a) => {
      const mo = String(a.occurred_on ?? "").slice(0, 7) || "—";
      const cur = months.get(mo) ?? new Map<string, number>();
      const hrs = recordedHours(a) + estimatedHours(a);
      if (hrs > 0) cur.set(catOf(a), (cur.get(catOf(a)) ?? 0) + hrs);
      months.set(mo, cur);
    });
    const list = [...months.entries()].filter(([, c]) => c.size > 0).sort((a, b) => a[0].localeCompare(b[0]));
    const max = Math.max(1, ...list.map(([, c]) => [...c.values()].reduce((s, v) => s + v, 0)));
    return { list, max };
  }, [rows]);

  const patchTime = (rec: ConsultingRecord, patch: Record<string, any>) =>
    onSave("activities", rec.id, {
      title: rec.title,
      status: rec.status,
      occurred_on: rec.occurred_on,
      data: { ...(rec.data ?? {}), ...patch },
    });

  return (
    <div className="space-y-5">
      <div className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Director of Security Time &amp; Activity Ledger</h3>
            <p className="mt-1 text-xs text-slate-400">
              Recorded and estimated hours are kept separate. Entries marked “Not Recorded” can be updated at any time.
            </p>
          </div>
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              downloadCsv(
                "director-activity-ledger.csv",
                rows.map((a) => ({
                  date: a.occurred_on ?? "",
                  activity: a.title,
                  category: catOf(a),
                  location: locOf(a),
                  start: a.data?.startTime ?? "",
                  end: a.data?.endTime ?? "",
                  recorded_hours: recordedHours(a) || "",
                  estimated_hours: estimatedHours(a) || "",
                  time_status: timeStatusLabel(a),
                  status: a.status,
                  notes: a.data?.notes ?? "",
                })),
              )
            }
          >
            Export ledger (CSV)
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="block">
            <span className={labelCls}>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Category</span>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>
              <option value="">All</option>
              {DIRECTOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Totals grouped by</span>
            <select value={group} onChange={(e) => setGroup(e.target.value as any)} className={inputCls}>
              {GROUPINGS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Activities" value={String(rows.length)} />
          <Stat label="Recorded Hours" value={totalRec.toFixed(2)} tone="text-kairos-gold" />
          <Stat label="Estimated Hours" value={totalEst.toFixed(2)} tone="text-sky-300" />
          <Stat label="Time Not Recorded" value={String(rows.filter((a) => timeStatusLabel(a) === "Not Recorded").length)} />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                {["Date", "Activity", "Category", "Location", "Start", "End", "Recorded", "Estimated", "Time Status", "Status", "Notes"].map((h) => (
                  <th key={h} className="border-b border-white/5 px-2 py-2 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-2 py-4 text-slate-500">
                    No activity recorded for this range.
                  </td>
                </tr>
              )}
              {rows.map((a) => {
                const status = timeStatusLabel(a);
                return (
                  <tr key={a.id} className="align-top text-slate-300">
                    <td className="whitespace-nowrap border-b border-white/5 px-2 py-2 font-mono text-[11px]">{a.occurred_on ?? "—"}</td>
                    <td className="border-b border-white/5 px-2 py-2 text-white">{a.title}</td>
                    <td className="border-b border-white/5 px-2 py-2">{catOf(a)}</td>
                    <td className="border-b border-white/5 px-2 py-2">{locOf(a) || "—"}</td>
                    <td className="border-b border-white/5 px-2 py-2 font-mono text-[11px]">{a.data?.startTime || "—"}</td>
                    <td className="border-b border-white/5 px-2 py-2 font-mono text-[11px]">{a.data?.endTime || "—"}</td>
                    <td className="border-b border-white/5 px-2 py-2 font-mono text-kairos-gold">{recordedHours(a) ? recordedHours(a).toFixed(2) : "—"}</td>
                    <td className="border-b border-white/5 px-2 py-2 font-mono text-sky-300">{estimatedHours(a) ? estimatedHours(a).toFixed(2) : "—"}</td>
                    <td className="border-b border-white/5 px-2 py-2">
                      {canEdit ? (
                        <select
                          value={status}
                          onChange={(e) => patchTime(a, { timeStatus: e.target.value })}
                          className="h-8 rounded-lg border border-white/10 bg-bg-deep px-2 text-[11px] text-white"
                        >
                          {TIME_STATUSES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        status
                      )}
                    </td>
                    <td className="border-b border-white/5 px-2 py-2">
                      <span className={`rounded border px-2 py-1 text-[10px] font-bold ${statusTone(a.status)}`}>{a.status}</span>
                    </td>
                    <td className="border-b border-white/5 px-2 py-2 text-[11px] text-slate-400">
                      {String(a.data?.notes ?? "").slice(0, 140)}
                      {canEdit && (
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            defaultValue={status === "Estimated" ? estimatedHours(a) || "" : recordedHours(a) || ""}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (!Number.isFinite(v) || v <= 0) return;
                              patchTime(
                                a,
                                status === "Estimated"
                                  ? { estimatedHours: v, timeStatus: "Estimated" }
                                  : { hours: v, timeStatus: status === "Not Recorded" ? "Recorded" : status },
                              );
                            }}
                            className="h-8 w-20 rounded-lg border border-white/10 bg-bg-deep px-2 text-[11px] text-white"
                            placeholder="hrs"
                          />
                          <span className="text-[10px] text-slate-500">enter hours</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Totals by {group}</h3>
        <ul className="mt-3 space-y-2">
          {groups.length === 0 && <li className="text-xs text-slate-500">Nothing to total yet.</li>}
          {groups.map(([k, v]) => (
            <li key={k} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span className="text-white">{k}</span>
              <span className="font-mono">
                <span className="text-kairos-gold">{v.rec.toFixed(2)} rec</span> ·{" "}
                <span className="text-sky-300">{v.est.toFixed(2)} est</span> · {v.count} activities
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={card}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Monthly Hours by Category</h3>
        <div className="mt-4 space-y-4">
          {chart.list.length === 0 && <p className="text-xs text-slate-500">No hours entered yet.</p>}
          {chart.list.map(([mo, cats]) => {
            const total = [...cats.values()].reduce((s, v) => s + v, 0);
            return (
              <div key={mo}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{mo}</span>
                  <span className="font-mono text-slate-400">{total.toFixed(2)} hrs</span>
                </div>
                <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-white/5" style={{ width: `${Math.max(8, (total / chart.max) * 100)}%` }}>
                  {[...cats.entries()].map(([c, v], i) => (
                    <div
                      key={c}
                      title={`${c}: ${v.toFixed(2)} hrs`}
                      className={["bg-kairos-gold", "bg-sky-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400", "bg-rose-400"][i % 6]}
                      style={{ width: `${(v / total) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[...cats.entries()].map(([c, v]) => (
                    <span key={c} className="text-[10px] text-slate-400">
                      {c} {v.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================== Master timeline ===================== */

const TIMELINE_SOURCES: { key: EntityKey; label: string }[] = [
  { key: "activities", label: "Activity" },
  { key: "siteVisits", label: "Site Visit" },
  { key: "actionItems", label: "Action Item" },
  { key: "recommendations", label: "Recommendation" },
  { key: "decisions", label: "Decision" },
  { key: "notes", label: "Progress Note" },
  { key: "briefings", label: "Assessment" },
  { key: "milestones", label: "Milestone" },
];

export function MasterTimeline({ records }: { records: Records }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");

  const items = useMemo(() => {
    const all = TIMELINE_SOURCES.flatMap(({ key, label }) =>
      (records[key] ?? []).map((r) => ({
        rec: r,
        kind: label,
        date: String(r.occurred_on ?? r.data?.targetDate ?? ""),
        category: catOf(r),
        site: locOf(r),
        hours: recordedHours(r),
        estimated: estimatedHours(r),
      })),
    );
    return all
      .filter((i) => {
        if (from && i.date < from) return false;
        if (to && i.date > to) return false;
        if (cat && i.category !== cat) return false;
        if (site && !i.site.toLowerCase().includes(site.toLowerCase())) return false;
        if (status && i.rec.status !== status) return false;
        if (kind && i.kind !== kind) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, from, to, cat, site, status, kind]);

  const statuses = useMemo(
    () => Array.from(new Set(TIMELINE_SOURCES.flatMap(({ key }) => (records[key] ?? []).map((r) => r.status)))).sort(),
    [records],
  );

  return (
    <div className={card}>
      <h3 className="text-sm font-bold uppercase tracking-widest text-white">Full Activity Timeline</h3>
      <p className="mt-1 text-xs text-slate-400">
        Every activity, site visit, assessment, recommendation, decision, note and action item in date order.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="block">
          <span className={labelCls}>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Category</span>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>
            <option value="">All</option>
            {DIRECTOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Site</span>
          <input value={site} onChange={(e) => setSite(e.target.value)} className={inputCls} placeholder="Main Campus" />
        </label>
        <label className="block">
          <span className={labelCls}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Record Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
            <option value="">All</option>
            {TIMELINE_SOURCES.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ol className="mt-5 ml-3 space-y-3 border-l border-white/10">
        {items.length === 0 && <li className="pl-5 text-xs text-slate-500">Nothing matches these filters.</li>}
        {items.slice(0, 200).map((i) => (
          <li key={`${i.kind}-${i.rec.id}`} className="relative pl-5">
            <span className="absolute -left-[7px] top-4 size-3 rounded-full border border-white/30 bg-bg-deep" />
            <div className="rounded-xl border border-white/5 bg-bg-deep p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    {fmtDay(i.date || null)} · {i.kind}
                  </div>
                  <div className="text-sm font-semibold text-white">{i.rec.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {i.category}
                    {i.site ? ` · ${i.site}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-kairos-gold">
                    {i.hours ? `${i.hours.toFixed(2)} hrs` : i.estimated ? `${i.estimated.toFixed(2)} est` : "Time not recorded"}
                  </span>
                  <span className={`rounded border px-2 py-1 text-[10px] font-bold ${statusTone(i.rec.status)}`}>{i.rec.status}</span>
                </div>
              </div>
              {(i.rec.data?.notes || i.rec.data?.content || i.rec.data?.summary || i.rec.data?.description) && (
                <p className="mt-2 text-[11px] text-slate-400">
                  {String(i.rec.data?.notes ?? i.rec.data?.content ?? i.rec.data?.summary ?? i.rec.data?.description).slice(0, 220)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function downloadCsv(name: string, rows: Record<string, any>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ===================== Director report sections ===================== */

const PERIODS = ["Weekly", "Monthly", "Quarterly", "Custom Date Range"] as const;

function periodStart(period: string): string {
  const d = new Date();
  if (period === "Weekly") d.setDate(d.getDate() - 7);
  else if (period === "Monthly") d.setMonth(d.getMonth() - 1);
  else if (period === "Quarterly") d.setMonth(d.getMonth() - 3);
  else return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 border-t border-white/5 pt-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">Nothing recorded for this period.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((t, i) => (
            <li key={i} className="text-sm text-slate-300">
              • {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Director of Security report block, appended to the Executive Report page. */
export function DirectorReportSections({ records }: { records: Records }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState(() => {
    try {
      return localStorage.getItem("kairos:director-report-summary") ?? "";
    } catch {
      return "";
    }
  });

  const saveSummary = (text: string) => {
    setSummary(text);
    try {
      localStorage.setItem("kairos:director-report-summary", text);
    } catch {
      /* storage unavailable */
    }
  };

  const start = period === "Custom Date Range" ? from : periodStart(period);
  const end = period === "Custom Date Range" ? to : "";

  const inPeriod = (r: ConsultingRecord) => {
    const d = String(r.occurred_on ?? "");
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  const acts = records.activities.filter(inPeriod);
  const byCat = (needle: RegExp) =>
    acts.filter((a) => needle.test(catOf(a))).map((a) => `${fmtDay(a.occurred_on)} — ${a.title} (${a.status})`);
  const rec = acts.reduce((s, a) => s + recordedHours(a), 0);
  const est = acts.reduce((s, a) => s + estimatedHours(a), 0);

  return (
    <div className="mt-8 border-t-2 border-kairos-gold/30 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Director of Security — Executive Summary</h2>
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <label className="block">
            <span className={labelCls}>Report Period</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className={inputCls}>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          {period === "Custom Date Range" && (
            <>
              <label className="block">
                <span className={labelCls}>From</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>To</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
              </label>
            </>
          )}
        </div>
      </div>

      <p className="mt-1 text-xs text-slate-400">
        {period}
        {start ? ` · from ${fmtDay(start)}` : " · all dates"}
        {end ? ` to ${fmtDay(end)}` : ""} · {acts.length} activities
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Recorded Hours" value={rec.toFixed(2)} tone="text-kairos-gold" />
        <Stat label="Estimated Hours" value={est.toFixed(2)} tone="text-sky-300" />
        <Stat label="Activities" value={String(acts.length)} />
        <Stat label="Time Not Recorded" value={String(acts.filter((a) => timeStatusLabel(a) === "Not Recorded").length)} />
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelCls}>Director's Summary (appears at the top of the printed report)</span>
          <Dictate label="Speak summary" onText={(t) => saveSummary(appendSpoken(summary, t))} className="print:hidden" />
        </div>
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => saveSummary(e.target.value)}
          placeholder="Speak or type your summary of this period — what was accomplished, what needs attention, and what leadership should know."
          className={`${inputCls} h-auto py-2`}
        />
      </div>

      <ReportSection title="Security Operations" items={byCat(/security operations|private security/i)} />
      <ReportSection title="Incidents & Investigations" items={byCat(/incident|investigation/i)} />
      <ReportSection title="Executive / VIP Protection" items={byCat(/executive protection/i)} />
      <ReportSection title="HPD / Officer Coordination" items={byCat(/hpd/i)} />
      <ReportSection title="Emergency Preparedness" items={byCat(/preparedness|emergency response|weather/i)} />
      <ReportSection title="Security Technology" items={byCat(/technology|cctv|access control|visitor management|communications/i)} />
      <ReportSection title="Policies & SOPs" items={byCat(/policy|sop|key control/i)} />
      <ReportSection title="Training & Team Development" items={byCat(/training|srt|ert|team management/i)} />
      <ReportSection
        title="Assessments"
        items={[
          ...records.briefings.filter(inPeriod).map((b) => `${fmtDay(b.occurred_on)} — ${b.title} (${b.status})`),
          ...byCat(/assessment/i),
        ]}
      />
      <ReportSection
        title="Recommendations"
        items={records.recommendations
          .filter(inPeriod)
          .map((r) => `${r.title} — ${r.status}${r.data?.decision ? ` (${r.data.decision})` : ""}`)}
      />
      <ReportSection
        title="Completed Improvements"
        items={records.beforeAfter
          .filter(inPeriod)
          .map((b) => `${b.title} — ${b.status}${b.data?.afterResult ? `: ${b.data.afterResult}` : ""}`)}
      />
      <ReportSection
        title="Outstanding Action Items"
        items={records.actionItems
          .filter((a) => a.status !== "Completed")
          .map((a) => `${a.title} — ${a.data?.priority ?? ""} ${a.status}${a.data?.owner ? ` · ${a.data.owner}` : ""}`)}
      />
      <ReportSection
        title="Leadership Decisions Needed"
        items={records.decisions
          .filter((d) => d.status === "Under Review")
          .map((d) => `${d.data?.question || d.title}`)}
      />
      <ReportSection
        title="Upcoming Priorities"
        items={[
          ...records.actionItems
            .filter((a) => a.status !== "Completed" && a.occurred_on)
            .slice(0, 10)
            .map((a) => `Due ${fmtDay(a.occurred_on)} — ${a.title}`),
          ...records.milestones
            .filter((m) => m.status !== "Completed")
            .map((m) => `${m.title} — target ${fmtDay(m.data?.targetDate)}`),
        ]}
      />
    </div>
  );
}
