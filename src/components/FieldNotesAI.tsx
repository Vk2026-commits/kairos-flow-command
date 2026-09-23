import { useState } from "react";
import { structureFieldNotes, type FieldNoteDraft } from "@/lib/field-notes.functions";
import type { ConsultingRecord, EntityKey } from "@/lib/consulting";
import Dictate, { appendSpoken } from "./Dictate";

/**
 * Field-notes assistant for operations supervisors: speak or type what happened
 * in the field, and the app drafts observations, recommendations, action items
 * and a progress note in the existing Kairos Command categories. Nothing is
 * saved until the supervisor reviews the draft and presses Save.
 */

const card = "rounded-2xl border border-white/5 bg-surface p-5";
const inputCls =
  "w-full px-3 py-2 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1";
const btnPrimary =
  "px-3 py-2 rounded-lg bg-kairos-blue text-white text-xs font-semibold uppercase tracking-wider transition disabled:opacity-40";
const btnGhost =
  "px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition";

type Save = (entity: EntityKey, id: string | null, record: Partial<ConsultingRecord>) => Promise<void> | void;

export default function FieldNotesAI({
  canEdit,
  clientName,
  onSave,
}: {
  canEdit: boolean;
  clientName?: string;
  onSave: Save;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<FieldNoteDraft | null>(null);
  const [pick, setPick] = useState<{ obs: boolean; recs: boolean[]; acts: boolean[]; note: boolean }>({
    obs: true,
    recs: [],
    acts: [],
    note: true,
  });
  const [saved, setSaved] = useState(false);

  const structure = async () => {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      const res = (await structureFieldNotes({
        data: { notes, client: clientName ?? "", day, location },
      })) as FieldNoteDraft;
      setDraft(res);
      setPick({
        obs: res.observations.length > 0,
        recs: res.recommendations.map(() => true),
        acts: res.actionItems.map(() => true),
        note: Boolean(res.progressNote),
      });
    } catch (e) {
      setErr((e as Error).message || "Could not structure those notes.");
    } finally {
      setBusy(false);
    }
  };

  const saveAll = async () => {
    if (!draft) return;
    setBusy(true);
    setErr(null);
    try {
      if (pick.obs && draft.observations.length) {
        await onSave("siteVisits", null, {
          title: `Field Observation — ${location || "Site"} — ${day}`,
          status: "Follow-Up Required",
          occurred_on: day,
          data: {
            location,
            problems: draft.observations
              .map((o) => `• ${o.title}${o.location ? ` (${o.location})` : ""} [${o.status}] — ${o.detail}`)
              .join("\n"),
            recommended: draft.recommendations.map((r) => `• ${r.title} — ${r.solution}`).join("\n"),
            followUps: draft.actionItems.map((a) => `• ${a.title}`).join("\n"),
            notes: draft.summary,
          },
        });
      }
      for (let i = 0; i < draft.recommendations.length; i++) {
        if (!pick.recs[i]) continue;
        const r = draft.recommendations[i];
        await onSave("recommendations", null, {
          title: r.title,
          status: r.status,
          occurred_on: day,
          data: {
            priority: r.priority,
            decision: "Under Review",
            location,
            problem: r.problem,
            solution: r.solution,
            expectedImpact: r.expectedImpact ?? "",
            actualResult: "Not measured — pending implementation.",
          },
        });
      }
      for (let i = 0; i < draft.actionItems.length; i++) {
        if (!pick.acts[i]) continue;
        const a = draft.actionItems[i];
        await onSave("actionItems", null, {
          title: a.title,
          status: a.status,
          occurred_on: null,
          data: { priority: a.priority, owner: a.owner ?? "", description: a.description, relatedArea: location },
        });
      }
      if (pick.note && draft.progressNote) {
        await onSave("notes", null, {
          title: `Field Notes — ${day}`,
          status: "Project Team",
          occurred_on: day,
          data: { category: "Field Observation", content: draft.progressNote },
        });
      }
      setSaved(true);
      setDraft(null);
      setNotes("");
    } catch (e) {
      setErr((e as Error).message || "Could not save those records.");
    } finally {
      setBusy(false);
    }
  };

  if (!canEdit) return null;

  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Field Notes Assistant</h3>
          <p className="text-[11px] text-slate-400">
            Speak or type what you saw in the field. The app drafts observations, recommendations, action items and a
            progress note for you to review before anything is saved.
          </p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className={`${btnGhost} ml-auto shrink-0`}>
          {open ? "Close" : "Open"}
        </button>
      </div>

      {saved && <p className="mt-3 text-[11px] text-emerald-400">Saved to the client workspace.</p>}

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location / Area</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Main campus, Green Lot, Ruth Street…"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={`${labelCls} mb-0`}>Field Notes</label>
              <Dictate onText={(spoken) => setNotes((cur) => appendSpoken(cur, spoken))} />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="What did you see, who did you talk to, what needs to change?"
              className={inputCls}
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Only what you say is used. Anything unclear is marked NEEDS VERIFICATION instead of guessed.
            </p>
          </div>

          {err && <p className="text-[11px] text-red-400">{err}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={structure} disabled={busy || notes.trim().length < 15} className={btnPrimary}>
              {busy ? "Working…" : "Structure notes"}
            </button>
            {draft && (
              <button type="button" onClick={() => setDraft(null)} className={btnGhost}>
                Discard draft
              </button>
            )}
          </div>

          {draft && (
            <div className="space-y-4 rounded-xl border border-white/10 bg-bg-deep/60 p-4">
              {draft.summary && <p className="text-xs text-slate-300">{draft.summary}</p>}

              {draft.observations.length > 0 && (
                <Section
                  title="Observations → Site Visits"
                  checked={pick.obs}
                  onToggle={() => setPick((p) => ({ ...p, obs: !p.obs }))}
                >
                  <ul className="space-y-1">
                    {draft.observations.map((o, i) => (
                      <li key={i} className="text-[11px] text-slate-300">
                        <span className="font-semibold text-white">{o.title}</span>
                        {o.location ? ` · ${o.location}` : ""} · <Tag>{o.status}</Tag>
                        <div className="text-slate-400">{o.detail}</div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {draft.recommendations.map((r, i) => (
                <Section
                  key={`r${i}`}
                  title={`Recommendation — ${r.title}`}
                  checked={Boolean(pick.recs[i])}
                  onToggle={() =>
                    setPick((p) => {
                      const recs = [...p.recs];
                      recs[i] = !recs[i];
                      return { ...p, recs };
                    })
                  }
                >
                  <p className="text-[11px] text-slate-400">
                    <Tag>{r.status}</Tag> <Tag>{r.priority}</Tag>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    <b>Problem:</b> {r.problem}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    <b>Recommended:</b> {r.solution}
                  </p>
                  {r.expectedImpact && (
                    <p className="text-[11px] text-slate-400">
                      <b>Expected impact:</b> {r.expectedImpact}
                    </p>
                  )}
                </Section>
              ))}

              {draft.actionItems.map((a, i) => (
                <Section
                  key={`a${i}`}
                  title={`Action Item — ${a.title}`}
                  checked={Boolean(pick.acts[i])}
                  onToggle={() =>
                    setPick((p) => {
                      const acts = [...p.acts];
                      acts[i] = !acts[i];
                      return { ...p, acts };
                    })
                  }
                >
                  <p className="text-[11px] text-slate-400">
                    <Tag>{a.status}</Tag> <Tag>{a.priority}</Tag>
                    {a.owner ? ` · ${a.owner}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-300">{a.description}</p>
                </Section>
              ))}

              {draft.progressNote && (
                <Section
                  title="Progress Note"
                  checked={pick.note}
                  onToggle={() => setPick((p) => ({ ...p, note: !p.note }))}
                >
                  <p className="text-[11px] text-slate-300 whitespace-pre-wrap">{draft.progressNote}</p>
                </Section>
              )}

              <button type="button" onClick={saveAll} disabled={busy} className={btnPrimary}>
                {busy ? "Saving…" : "Save selected records"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  checked,
  onToggle,
  children,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <label className="flex items-start gap-2 mb-2 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-white">{title}</span>
      </label>
      <div className="space-y-1 pl-6">{children}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] uppercase tracking-wider text-slate-200">
      {children}
    </span>
  );
}
