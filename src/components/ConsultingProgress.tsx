import { useEffect, useMemo, useState } from "react";
import {
  loadConsulting,
  saveConsultingProject,
  saveConsultingRecord,
  deleteConsultingRecord,
} from "@/lib/consulting.functions";
import { listDocuments, uploadDocument } from "@/lib/documents.functions";
import { ensureDeviceCode, getDeviceCode } from "@/lib/device-access";
import {
  ENTITY_CONFIG,
  ENTITY_ORDER,
  PROJECT_STATUSES,
  fmtDay,
  hoursBetween,
  priorityTone,
  statusTone,
  toCsv,
  type ConsultingProject,
  type ConsultingRecord,
  type EntityKey,
  type Field,
} from "@/lib/consulting";

type Records = Record<EntityKey, ConsultingRecord[]>;
type Role = "admin" | "executive";
type DocRow = { id: string; title: string; url: string; contentType?: string | null };

const EMPTY: Records = {
  activities: [],
  siteVisits: [],
  milestones: [],
  actionItems: [],
  recommendations: [],
  notes: [],
  beforeAfter: [],
};

type Tab = "dashboard" | EntityKey | "history" | "report";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Executive Dashboard" },
  { key: "activities", label: "Work Activity" },
  { key: "siteVisits", label: "Site Visits" },
  { key: "milestones", label: "Timeline" },
  { key: "actionItems", label: "Action Items" },
  { key: "recommendations", label: "Recommendations" },
  { key: "notes", label: "Progress Notes" },
  { key: "beforeAfter", label: "Before / After" },
  { key: "history", label: "Hours & History" },
  { key: "report", label: "Executive Report" },
];

const DEFAULT_PROJECT: ConsultingProject = {
  status: "Assessment",
  phase: "Existing Conditions Assessment",
  progress_pct: 0,
  next_action: "",
  summary: "",
};

const card = "rounded-2xl border border-white/5 bg-surface p-5";
const inputCls =
  "w-full h-9 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1";
const btnPrimary =
  "px-3 py-2 rounded-lg bg-kairos-blue text-white text-xs font-semibold uppercase tracking-wider transition disabled:opacity-40";
const btnGhost =
  "px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition";

export default function ConsultingProgress() {
  const [code, setCode] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("executive");
  const [project, setProject] = useState<ConsultingProject>(DEFAULT_PROJECT);
  const [records, setRecords] = useState<Records>(EMPTY);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async (c: string) => {
    setLoading(true);
    try {
      const res: any = await loadConsulting({ data: { code: c } });
      setRole((res.role ?? "executive") as Role);
      setProject({ ...DEFAULT_PROJECT, ...(res.project ?? {}) });
      setRecords({ ...EMPTY, ...(res.records ?? {}) });
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Could not load consulting progress");
    } finally {
      setLoading(false);
    }
    try {
      const d: any = await listDocuments({ data: { code: c } });
      setDocs((d?.rows ?? []) as DocRow[]);
    } catch {
      /* attachments are optional */
    }
  };

  useEffect(() => {
    const stored = getDeviceCode();
    if (stored) {
      setCode(stored);
      void refresh(stored);
    }
  }, []);

  const unlock = async () => {
    const c = await ensureDeviceCode({ force: !getDeviceCode() });
    if (!c) return;
    setCode(c);
    await refresh(c);
  };

  const canEdit = role === "admin";

  const saveRecord = async (entity: EntityKey, id: string | null, record: Partial<ConsultingRecord>) => {
    if (!code) return;
    try {
      await saveConsultingRecord({ data: { code, entity, id, record: record as any } });
      await refresh(code);
    } catch (e) {
      setError((e as Error).message || "Could not save that record");
    }
  };

  const removeRecord = async (entity: EntityKey, id: string) => {
    if (!code) return;
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    try {
      await deleteConsultingRecord({ data: { code, entity, id } });
      await refresh(code);
    } catch (e) {
      setError((e as Error).message || "Could not delete that record");
    }
  };

  const saveProject = async (next: ConsultingProject) => {
    if (!code) return;
    setProject(next);
    try {
      await saveConsultingProject({ data: { code, project: next as any } });
    } catch (e) {
      setError((e as Error).message || "Could not save the project summary");
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!code) return;
    const base64 = await fileToBase64(file);
    await uploadDocument({
      data: { code, name: file.name, contentType: file.type || "application/octet-stream", size: file.size, base64 },
    });
    const d: any = await listDocuments({ data: { code } });
    setDocs((d?.rows ?? []) as DocRow[]);
  };

  if (!code) {
    return (
      <div className={`${card} max-w-xl`}>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-1">Consulting Progress</h2>
        <p className="text-xs text-slate-400 mb-4">
          This area is restricted. Enter an access code to continue — admin codes can edit, executive codes are
          view-only.
        </p>
        <button type="button" onClick={() => void unlock()} className="px-3 py-2 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold">
          Enter access code
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition ${
              tab === t.key
                ? "bg-kairos-blue border-kairos-blue text-white"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-slate-500">
          {role === "admin" ? "Admin · full access" : "Executive · view only"}
          {loading && " · loading…"}
        </span>
      </div>

      {error && <div className="text-[11px] text-red-400">{error}</div>}

      {tab === "dashboard" && (
        <Dashboard project={project} records={records} canEdit={canEdit} onSaveProject={saveProject} />
      )}

      {ENTITY_ORDER.includes(tab as EntityKey) && (
        <RecordSection
          entity={tab as EntityKey}
          rows={records[tab as EntityKey]}
          docs={docs}
          canEdit={canEdit}
          onSave={saveRecord}
          onDelete={removeRecord}
          onUpload={uploadAttachment}
        />
      )}

      {tab === "history" && <History records={records} />}
      {tab === "report" && <ExecutiveReport project={project} records={records} />}
    </div>
  );
}

/* ============================== Dashboard ============================== */

function Dashboard({
  project,
  records,
  canEdit,
  onSaveProject,
}: {
  project: ConsultingProject;
  records: Records;
  canEdit: boolean;
  onSaveProject: (p: ConsultingProject) => void;
}) {
  const [draft, setDraft] = useState(project);
  useEffect(() => setDraft(project), [project]);

  const openItems = records.actionItems.filter((a) => a.status !== "Completed");
  const doneItems = records.actionItems.filter((a) => a.status === "Completed");
  const activeRecs = records.recommendations.filter((r) => r.status !== "Verified");
  const lastVisit = records.siteVisits.find((v) => v.occurred_on);
  const upcoming = records.milestones
    .filter((m) => m.status !== "Completed")
    .sort((a, b) => String(a.data?.targetDate ?? "9999").localeCompare(String(b.data?.targetDate ?? "9999")))
    .slice(0, 5);
  const issues = records.activities
    .filter((a) => a.data?.issues)
    .slice(0, 5);
  const recent = [
    ...records.activities.map((r) => ({ ...r, kind: "Activity" })),
    ...records.siteVisits.map((r) => ({ ...r, kind: "Site Visit" })),
    ...records.notes.map((r) => ({ ...r, kind: "Note" })),
  ]
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className={card}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Current Project Status</h2>
            <p className="text-xs text-slate-400 mt-1">Wheeler Avenue Baptist Church · Parking & Traffic Consulting</p>
          </div>
          <span className={`text-[11px] font-bold px-2 py-1 rounded border ${statusTone(project.status)}`}>
            {project.status}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Overall progress</span>
            <span>{project.progress_pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-kairos-gold" style={{ width: `${project.progress_pct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Stat label="Current Phase" value={project.phase || "—"} />
          <Stat label="Last Site Visit" value={fmtDay(lastVisit?.occurred_on)} />
          <Stat label="Open Action Items" value={String(openItems.length)} />
          <Stat label="Completed Action Items" value={String(doneItems.length)} />
          <Stat label="Active Recommendations" value={String(activeRecs.length)} />
          <Stat label="Site Visits Logged" value={String(records.siteVisits.length)} />
          <Stat label="Activities Logged" value={String(records.activities.length)} />
          <Stat label="Next Scheduled Action" value={project.next_action || "—"} />
        </div>

        {project.summary && <p className="mt-5 text-sm text-slate-300 whitespace-pre-wrap">{project.summary}</p>}

        {canEdit && (
          <div className="mt-6 border-t border-white/5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className={labelCls}>Project Status</span>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className={inputCls}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Current Phase</span>
              <input value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Overall Progress %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.progress_pct}
                onChange={(e) => setDraft({ ...draft, progress_pct: Number(e.target.value) })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Next Scheduled Action</span>
              <input
                value={draft.next_action ?? ""}
                onChange={(e) => setDraft({ ...draft, next_action: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Project Summary</span>
              <textarea
                rows={3}
                value={draft.summary ?? ""}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                className={`${inputCls} h-auto py-2`}
              />
            </label>
            <div>
              <button type="button" onClick={() => onSaveProject(draft)} className={btnPrimary}>
                Save summary
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={card}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Recent Activity</h3>
          <ul className="space-y-2">
            {recent.length === 0 && <li className="text-xs text-slate-500">Nothing logged yet.</li>}
            {recent.map((r) => (
              <li key={`${r.kind}-${r.id}`} className="text-xs text-slate-300">
                <span className="font-mono text-[10px] text-slate-500 mr-2">{fmtDay(r.occurred_on)}</span>
                {r.title}
                <span className="ml-2 text-[10px] text-slate-500">{(r as any).kind}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Key Issues / Bottlenecks</h3>
          <ul className="space-y-2">
            {issues.length === 0 && <li className="text-xs text-slate-500">No open issues recorded.</li>}
            {issues.map((a) => (
              <li key={a.id} className="text-xs text-slate-300">
                <span className="text-white">{a.title}</span> — {String(a.data.issues).slice(0, 120)}
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Upcoming Milestones</h3>
          <ul className="space-y-2">
            {upcoming.length === 0 && <li className="text-xs text-slate-500">No milestones scheduled.</li>}
            {upcoming.map((m) => (
              <li key={m.id} className="text-xs text-slate-300 flex items-center justify-between gap-2">
                <span>{m.title}</span>
                <span className="font-mono text-[10px] text-slate-500">{fmtDay(m.data?.targetDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-sm text-white mt-1 break-words">{value}</div>
    </div>
  );
}

/* ============================ Record sections ============================ */

function RecordSection({
  entity,
  rows,
  docs,
  canEdit,
  onSave,
  onDelete,
  onUpload,
}: {
  entity: EntityKey;
  rows: ConsultingRecord[];
  docs: DocRow[];
  canEdit: boolean;
  onSave: (entity: EntityKey, id: string | null, record: Partial<ConsultingRecord>) => void;
  onDelete: (entity: EntityKey, id: string) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const cfg = ENTITY_CONFIG[entity];
  const [editing, setEditing] = useState<ConsultingRecord | "new" | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (status && r.status !== status) return false;
        if (from && (r.occurred_on ?? "") < from) return false;
        if (to && (r.occurred_on ?? "") > to) return false;
        if (q) {
          const hay = `${r.title} ${r.status} ${r.occurred_on ?? ""} ${JSON.stringify(r.data)}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [rows, q, status, from, to],
  );

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">{cfg.label}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(`${entity}.csv`, filtered)}
              className={btnGhost}
            >
              Export CSV
            </button>
            {canEdit && (
              <button type="button" onClick={() => setEditing("new")} className={btnPrimary}>
                + Add {cfg.singular}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <label className="block sm:col-span-2">
            <span className={labelCls}>Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Any word, person, lot…" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{cfg.statusLabel}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="">All</option>
              {cfg.statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className={labelCls}>From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            </label>
          </div>
        </div>
      </div>

      {entity === "milestones" ? (
        <Timeline rows={filtered} canEdit={canEdit} onEdit={setEditing} onDelete={(id) => onDelete(entity, id)} />
      ) : (
        <ul className="space-y-3">
          {filtered.length === 0 && <li className="text-xs text-slate-500">No records yet.</li>}
          {filtered.map((r) => (
            <li key={r.id} className={card}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{r.title}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {cfg.dateLabel}: {fmtDay(r.occurred_on)}
                    {entity === "siteVisits" &&
                      ` · ${hoursBetween(r.data?.arrival, r.data?.departure).toFixed(2)} hrs on-site`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.data?.priority && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${priorityTone(r.data.priority)}`}>
                      {r.data.priority}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${statusTone(r.status)}`}>
                    {r.status}
                  </span>
                  {canEdit && (
                    <>
                      <button type="button" onClick={() => setEditing(r)} className={btnGhost}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entity, r.id)}
                        className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <RecordDetails cfg={cfg} row={r} docs={docs} />
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <RecordEditor
          entity={entity}
          record={editing === "new" ? null : editing}
          docs={docs}
          onUpload={onUpload}
          onClose={() => setEditing(null)}
          onSubmit={(rec) => {
            onSave(entity, editing === "new" ? null : editing.id, rec);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RecordDetails({ cfg, row, docs }: { cfg: (typeof ENTITY_CONFIG)[EntityKey]; row: ConsultingRecord; docs: DocRow[] }) {
  const shown = cfg.fields.filter((f) => {
    const v = row.data?.[f.key];
    return f.type === "docs" ? Array.isArray(v) && v.length > 0 : Boolean(v);
  });
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 border-t border-white/5 pt-4">
      {shown.map((f) => (
        <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{f.label}</div>
          {f.type === "docs" ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {(row.data[f.key] as string[]).map((id) => {
                const d = docs.find((x) => x.id === id);
                if (!d) return null;
                return (
                  <a
                    key={id}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] px-2 py-1 rounded border border-white/10 bg-white/5 text-sky-300 hover:bg-white/10"
                  >
                    {d.title}
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-300 whitespace-pre-wrap">
              {f.type === "date" ? fmtDay(String(row.data[f.key])) : String(row.data[f.key])}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Timeline({
  rows,
  canEdit,
  onEdit,
  onDelete,
}: {
  rows: ConsultingRecord[];
  canEdit: boolean;
  onEdit: (r: ConsultingRecord) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...rows].sort((a, b) =>
    String(a.data?.targetDate ?? a.occurred_on ?? "9999").localeCompare(
      String(b.data?.targetDate ?? b.occurred_on ?? "9999"),
    ),
  );
  return (
    <ol className="relative border-l border-white/10 ml-3 space-y-4">
      {sorted.length === 0 && <li className="pl-5 text-xs text-slate-500">No milestones yet.</li>}
      {sorted.map((m) => (
        <li key={m.id} className="pl-5 relative">
          <span
            className={`absolute -left-[7px] top-2 size-3 rounded-full border ${
              m.status === "Completed" ? "bg-emerald-400 border-emerald-400" : "bg-bg-deep border-white/30"
            }`}
          />
          <div className={card}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-white">{m.title}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Target {fmtDay(m.data?.targetDate)} · Completed {fmtDay(m.occurred_on)}
                  {m.data?.owner ? ` · Owner ${m.data.owner}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${statusTone(m.status)}`}>{m.status}</span>
                {canEdit && (
                  <>
                    <button type="button" onClick={() => onEdit(m)} className={btnGhost}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            {m.data?.notes && <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">{m.data.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ============================== Editor ============================== */

function RecordEditor({
  entity,
  record,
  docs,
  onUpload,
  onClose,
  onSubmit,
}: {
  entity: EntityKey;
  record: ConsultingRecord | null;
  docs: DocRow[];
  onUpload: (file: File) => Promise<void>;
  onClose: () => void;
  onSubmit: (rec: Partial<ConsultingRecord>) => void;
}) {
  const cfg = ENTITY_CONFIG[entity];
  const [title, setTitle] = useState(record?.title ?? (cfg.titleOptions ? cfg.titleOptions[0] : ""));
  const [status, setStatus] = useState(record?.status ?? cfg.statusOptions[0]);
  const [day, setDay] = useState(record?.occurred_on ?? "");
  const [data, setData] = useState<Record<string, any>>(record?.data ?? {});
  const [busy, setBusy] = useState(false);

  const onSite = entity === "siteVisits" ? hoursBetween(data.arrival, data.departure) : 0;

  const setField = (f: Field, v: any) => setData((d) => ({ ...d, [f.key]: v }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-surface p-6 my-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            {record ? `Edit ${cfg.singular}` : `New ${cfg.singular}`}
          </h3>
          <button type="button" onClick={onClose} className={btnGhost}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className={labelCls}>{cfg.titleLabel}</span>
            {cfg.titleOptions ? (
              <select value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}>
                {cfg.titleOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            )}
          </label>

          <label className="block">
            <span className={labelCls}>{cfg.dateLabel}</span>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{cfg.statusLabel}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {cfg.statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {cfg.fields.map((f) => (
            <label key={f.key} className={`block ${f.wide ? "sm:col-span-2" : ""}`}>
              <span className={labelCls}>{f.label}</span>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={data[f.key] ?? ""}
                  onChange={(e) => setField(f, e.target.value)}
                  className={`${inputCls} h-auto py-2`}
                />
              ) : f.type === "select" ? (
                <select value={data[f.key] ?? ""} onChange={(e) => setField(f, e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "docs" ? (
                <DocPicker
                  docs={docs}
                  selected={(data[f.key] as string[]) ?? []}
                  onChange={(ids) => setField(f, ids)}
                  onUpload={onUpload}
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
                  value={data[f.key] ?? ""}
                  onChange={(e) => setField(f, e.target.value)}
                  className={inputCls}
                />
              )}
            </label>
          ))}

          {entity === "siteVisits" && (
            <div className="sm:col-span-2 text-[11px] font-mono text-emerald-300">
              Total time on-site: {onSite.toFixed(2)} hours
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              const payload = { ...data };
              if (entity === "siteVisits") payload.hours = onSite;
              onSubmit({ title, status, occurred_on: day || null, data: payload });
            }}
            className={btnPrimary}
          >
            Save {cfg.singular}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DocPicker({
  docs,
  selected,
  onChange,
  onUpload,
}: {
  docs: DocRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="rounded-lg border border-white/10 bg-bg-deep p-3">
      <div className="flex flex-wrap gap-2">
        {docs.length === 0 && <span className="text-[11px] text-slate-500">No documents uploaded yet.</span>}
        {docs.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            className={`text-[11px] px-2 py-1 rounded border transition ${
              selected.includes(d.id)
                ? "border-kairos-gold text-kairos-gold bg-kairos-gold/10"
                : "border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 mt-3 text-[11px] text-slate-400 cursor-pointer">
        <span className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10">
          {busy ? "Uploading…" : "+ Upload photo / PDF"}
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            input.value = "";
            if (!file) return;
            setBusy(true);
            try {
              await onUpload(file);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </div>
  );
}

/* ============================ History & Report ============================ */

function History({ records }: { records: Records }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [loc, setLoc] = useState("");

  const inRange = (r: ConsultingRecord) => {
    const d = r.occurred_on ?? "";
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const activities = records.activities.filter(
    (a) =>
      inRange(a) &&
      (!type || a.data?.activityType === type) &&
      (!loc || String(a.data?.location ?? "").toLowerCase().includes(loc.toLowerCase())),
  );
  const visits = records.siteVisits.filter(
    (v) => inRange(v) && (!loc || String(v.data?.location ?? "").toLowerCase().includes(loc.toLowerCase())),
  );
  const hours = visits.reduce((s, v) => s + hoursBetween(v.data?.arrival, v.data?.departure), 0);
  const meetings = activities.filter((a) => String(a.data?.activityType ?? "").includes("Meeting")).length;
  const assessments = activities.filter((a) => String(a.data?.activityType ?? "").includes("Assessment")).length;
  const recs = records.recommendations.filter(inRange);
  const implemented = recs.filter((r) => ["Implemented", "Verified"].includes(r.status)).length;
  const items = records.actionItems.filter(inRange);
  const done = items.filter((i) => i.status === "Completed").length;

  return (
    <div className="space-y-5">
      <div className={card}>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Hours & Consulting History</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className={labelCls}>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Activity Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="">All</option>
              {ENTITY_CONFIG.activities.fields
                .find((f) => f.key === "activityType")!
                .options!.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Location</span>
            <input value={loc} onChange={(e) => setLoc(e.target.value)} className={inputCls} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
          <Stat label="Total Site Visits" value={String(visits.length)} />
          <Stat label="Total On-Site Hours" value={hours.toFixed(2)} />
          <Stat label="Total Meetings" value={String(meetings)} />
          <Stat label="Total Assessments" value={String(assessments)} />
          <Stat label="Total Recommendations" value={String(recs.length)} />
          <Stat label="Recommendations Implemented" value={String(implemented)} />
          <Stat label="Open Recommendations" value={String(recs.length - implemented)} />
          <Stat label="Completed Action Items" value={String(done)} />
          <Stat label="Open Action Items" value={String(items.length - done)} />
          <Stat label="Activities Logged" value={String(activities.length)} />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              downloadCsv(
                "consulting-history.csv",
                visits.map((v) => ({
                  date: v.occurred_on,
                  visit: v.title,
                  arrival: v.data?.arrival ?? "",
                  departure: v.data?.departure ?? "",
                  hours: hoursBetween(v.data?.arrival, v.data?.departure),
                  status: v.status,
                })),
              )
            }
          >
            Export site visits (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

function ExecutiveReport({ project, records }: { project: ConsultingProject; records: Records }) {
  const visits = records.siteVisits.slice(0, 5);
  const hours = records.siteVisits.reduce((s, v) => s + hoursBetween(v.data?.arrival, v.data?.departure), 0);
  const openItems = records.actionItems.filter((a) => a.status !== "Completed");
  const implemented = records.recommendations.filter((r) => ["Implemented", "Verified"].includes(r.status));
  const upcoming = records.milestones.filter((m) => m.status !== "Completed");

  return (
    <div className="space-y-5">
      <div className="flex gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className={btnPrimary}>
          Print / Save as PDF
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() =>
            downloadCsv(
              "executive-report.csv",
              records.recommendations.map((r) => ({
                recommendation: r.title,
                stage: r.status,
                decision: r.data?.decision ?? "",
                priority: r.data?.priority ?? "",
                location: r.data?.location ?? "",
                date: r.occurred_on ?? "",
              })),
            )
          }
        >
          Export recommendations (CSV)
        </button>
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold text-white">Executive Report</h2>
        <p className="text-xs text-slate-400 mt-1">
          Wheeler Avenue Baptist Church · Kairos Parking & Traffic Consulting ·{" "}
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5">
          <Stat label="Current Status" value={project.status} />
          <Stat label="Current Phase" value={project.phase || "—"} />
          <Stat label="Progress" value={`${project.progress_pct}%`} />
          <Stat label="On-Site Hours" value={hours.toFixed(2)} />
        </div>

        {project.summary && (
          <Section title="Project Summary">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{project.summary}</p>
          </Section>
        )}

        <Section title="Work Completed">
          <List items={records.activities.filter((a) => a.status === "Completed").map((a) => `${fmtDay(a.occurred_on)} — ${a.title}`)} />
        </Section>

        <Section title="Key Findings">
          <List items={records.activities.filter((a) => a.data?.issues).map((a) => `${a.title}: ${a.data.issues}`)} />
        </Section>

        <Section title="Recommendations">
          <List
            items={records.recommendations.map(
              (r) => `${r.title} — ${r.status}${r.data?.decision ? ` (${r.data.decision})` : ""}`,
            )}
          />
        </Section>

        <Section title="Changes Implemented">
          <List items={implemented.map((r) => `${r.title}${r.data?.actualResult ? ` — ${r.data.actualResult}` : ""}`)} />
        </Section>

        <Section title="Outstanding Issues & Next Steps">
          <List
            items={[
              ...openItems.map((a) => `${a.title} — ${a.status}${a.data?.assignedTo ? ` (${a.data.assignedTo})` : ""}`),
              ...(project.next_action ? [`Next scheduled action: ${project.next_action}`] : []),
            ]}
          />
        </Section>

        <Section title="Upcoming Milestones">
          <List items={upcoming.map((m) => `${m.title} — target ${fmtDay(m.data?.targetDate)} (${m.status})`)} />
        </Section>

        <Section title="Recent Site Visits">
          <List
            items={visits.map(
              (v) =>
                `${fmtDay(v.occurred_on)} — ${v.title} (${hoursBetween(v.data?.arrival, v.data?.departure).toFixed(2)} hrs)`,
            )}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-white/5 pt-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs text-slate-500">Nothing recorded yet.</p>;
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((t, i) => (
        <li key={i} className="text-sm text-slate-300">
          {t}
        </li>
      ))}
    </ul>
  );
}

/* ============================== helpers ============================== */

function downloadCsv(name: string, rows: Record<string, any>[]) {
  const flat = rows.map((r) => {
    const { data, ...rest } = r as any;
    return { ...rest, ...(data ?? {}) };
  });
  const csv = toCsv(flat);
  if (!csv) return;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}
