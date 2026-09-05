// Shared field schemas + helpers for the Admin → Consulting Progress area.
// Records are stored as a small set of indexed columns (title / status /
// occurred_on) plus a JSON payload, so every field below is data-driven.

export type FieldType = "text" | "textarea" | "date" | "time" | "select" | "number" | "docs";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  wide?: boolean;
  hint?: string;
};

export type ConsultingRecord = {
  id: string;
  title: string;
  status: string;
  occurred_on: string | null;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type ConsultingProject = {
  id?: string;
  status: string;
  phase: string;
  progress_pct: number;
  next_action: string | null;
  summary: string | null;
  updated_at?: string;
};

export const PROJECT_STATUSES = [
  "Planning",
  "Assessment",
  "Implementation",
  "Monitoring",
  "Optimization",
  "Completed",
] as const;

export const ACTIVITY_TYPES = [
  "Site Visit",
  "Sunday Observation",
  "Leadership Meeting",
  "Traffic Assessment",
  "Parking Assessment",
  "Map Update",
  "Ingress Planning",
  "Egress Planning",
  "Volunteer Parking Planning",
  "Staff Parking Planning",
  "First Touch Coordination",
  "Security Coordination",
  "Police Coordination",
  "Implementation",
  "Follow-Up",
  "Performance Review",
  "Other",
] as const;

export const MILESTONE_NAMES = [
  "Initial Walkthrough",
  "Sunday Observation",
  "Existing Conditions Assessment",
  "Traffic Flow Analysis",
  "Parking Plan Draft",
  "Volunteer Parking Plan",
  "Staff Parking Plan",
  "Ingress Plan",
  "Egress Plan",
  "Leadership Review",
  "Implementation Launch",
  "30-Day Review",
  "60-Day Review",
  "90-Day Review",
  "Optimization Review",
  "Final Recommendations",
] as const;

export const ACTION_STATUSES = ["Not Started", "In Progress", "Waiting", "Completed", "On Hold"] as const;
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export const MILESTONE_STATUSES = ["Not Started", "In Progress", "Completed", "Delayed", "Skipped"] as const;
export const REC_STAGES = ["Identified", "Recommended", "Approved", "Implemented", "Verified"] as const;
export const REC_DECISIONS = ["Under Review", "Approved", "Not Approved"] as const;
export const NOTE_VISIBILITY = ["Admin Only", "Executive Leadership", "Project Team"] as const;
export const NOTE_CATEGORIES = [
  "Daily Note",
  "Weekly Note",
  "Leadership Note",
  "Field Observation",
  "Private Admin Note",
] as const;
export const ACTIVITY_STATUSES = ["Completed", "In Progress", "Follow-Up Required"] as const;

export type EntityKey =
  | "activities"
  | "siteVisits"
  | "milestones"
  | "actionItems"
  | "recommendations"
  | "notes"
  | "beforeAfter";

export type EntityConfig = {
  key: EntityKey;
  label: string;
  singular: string;
  titleLabel: string;
  titleOptions?: readonly string[];
  statusLabel: string;
  statusOptions: readonly string[];
  dateLabel: string;
  fields: readonly Field[];
};

export const ENTITY_CONFIG: Record<EntityKey, EntityConfig> = {
  activities: {
    key: "activities",
    label: "Work Activity Log",
    singular: "Activity",
    titleLabel: "Title",
    statusLabel: "Status",
    statusOptions: ACTIVITY_STATUSES,
    dateLabel: "Date",
    fields: [
      { key: "activityType", label: "Activity Type", type: "select", options: ACTIVITY_TYPES },
      { key: "startTime", label: "Start Time", type: "time" },
      { key: "endTime", label: "End Time", type: "time" },
      { key: "location", label: "Location", type: "text" },
      { key: "assignedTo", label: "Assigned To", type: "text" },
      { key: "relatedLot", label: "Related Parking Lot / Zone", type: "text" },
      { key: "relatedPlan", label: "Related Map or Plan", type: "text" },
      { key: "createdBy", label: "Created By", type: "text" },
      { key: "notes", label: "Detailed Notes", type: "textarea", wide: true },
      { key: "progress", label: "Progress Made", type: "textarea", wide: true },
      { key: "issues", label: "Issues Identified", type: "textarea", wide: true },
      { key: "recommendations", label: "Recommendations", type: "textarea", wide: true },
      { key: "followUp", label: "Follow-Up Required", type: "textarea", wide: true },
      { key: "nextStep", label: "Next Step", type: "textarea", wide: true },
      { key: "attachments", label: "Attachments / Photos", type: "docs", wide: true },
    ],
  },
  siteVisits: {
    key: "siteVisits",
    label: "Site Visit Log",
    singular: "Site Visit",
    titleLabel: "Visit Title",
    statusLabel: "Status",
    statusOptions: ["Completed", "In Progress", "Follow-Up Required"],
    dateLabel: "Date",
    fields: [
      { key: "arrival", label: "Arrival Time", type: "time" },
      { key: "departure", label: "Departure Time", type: "time" },
      { key: "location", label: "Location", type: "text" },
      { key: "nextVisit", label: "Next Visit Date", type: "date" },
      { key: "peopleMet", label: "People Met With", type: "textarea", wide: true },
      { key: "areasInspected", label: "Areas Inspected", type: "textarea", wide: true },
      { key: "lotsReviewed", label: "Parking Lots Reviewed", type: "textarea", wide: true },
      { key: "trafficConditions", label: "Traffic Conditions Observed", type: "textarea", wide: true },
      { key: "problems", label: "Problems Identified", type: "textarea", wide: true },
      { key: "recommended", label: "Changes Recommended", type: "textarea", wide: true },
      { key: "implemented", label: "Changes Implemented", type: "textarea", wide: true },
      { key: "followUps", label: "Follow-Up Items", type: "textarea", wide: true },
      { key: "attachments", label: "Photos / Attachments", type: "docs", wide: true },
    ],
  },
  milestones: {
    key: "milestones",
    label: "Project Timeline",
    singular: "Milestone",
    titleLabel: "Milestone",
    titleOptions: MILESTONE_NAMES,
    statusLabel: "Status",
    statusOptions: MILESTONE_STATUSES,
    dateLabel: "Actual Completion Date",
    fields: [
      { key: "targetDate", label: "Target Date", type: "date" },
      { key: "owner", label: "Owner", type: "text" },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
      { key: "attachments", label: "Attachments", type: "docs", wide: true },
    ],
  },
  actionItems: {
    key: "actionItems",
    label: "Action Items",
    singular: "Action Item",
    titleLabel: "Action Item",
    statusLabel: "Status",
    statusOptions: ACTION_STATUSES,
    dateLabel: "Due Date",
    fields: [
      { key: "priority", label: "Priority", type: "select", options: PRIORITIES },
      { key: "assignedTo", label: "Assigned To", type: "text" },
      { key: "relatedArea", label: "Related Area", type: "text" },
      { key: "relatedVisit", label: "Related Site Visit", type: "text" },
      { key: "relatedRecommendation", label: "Related Recommendation", type: "text" },
      { key: "completedOn", label: "Completion Date", type: "date" },
      { key: "description", label: "Description", type: "textarea", wide: true },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
      { key: "attachments", label: "Attachments", type: "docs", wide: true },
    ],
  },
  recommendations: {
    key: "recommendations",
    label: "Recommendations",
    singular: "Recommendation",
    titleLabel: "Recommendation Title",
    statusLabel: "Implementation Stage",
    statusOptions: REC_STAGES,
    dateLabel: "Date Recommended",
    fields: [
      { key: "priority", label: "Priority", type: "select", options: PRIORITIES },
      { key: "decision", label: "Leadership Decision", type: "select", options: REC_DECISIONS },
      { key: "location", label: "Location / Parking Lot", type: "text" },
      { key: "responsible", label: "Responsible Party", type: "text" },
      { key: "problem", label: "Problem / Opportunity", type: "textarea", wide: true },
      { key: "solution", label: "Recommended Solution", type: "textarea", wide: true },
      { key: "expectedImpact", label: "Expected Impact", type: "textarea", wide: true },
      { key: "actualResult", label: "Actual Result", type: "textarea", wide: true },
      { key: "notes", label: "Notes", type: "textarea", wide: true },
      { key: "attachments", label: "Supporting Map / Photo / Document", type: "docs", wide: true },
    ],
  },
  notes: {
    key: "notes",
    label: "Progress Notes",
    singular: "Note",
    titleLabel: "Note Title",
    statusLabel: "Visibility",
    statusOptions: NOTE_VISIBILITY,
    dateLabel: "Date",
    fields: [
      { key: "category", label: "Category", type: "select", options: NOTE_CATEGORIES },
      { key: "author", label: "Author", type: "text" },
      { key: "content", label: "Note", type: "textarea", wide: true },
    ],
  },
  beforeAfter: {
    key: "beforeAfter",
    label: "Before / After",
    singular: "Improvement",
    titleLabel: "Improvement Title",
    statusLabel: "Status",
    statusOptions: ["In Progress", "Implemented", "Verified"],
    dateLabel: "Date Verified",
    fields: [
      { key: "location", label: "Location / Parking Lot", type: "text" },
      { key: "beforeIssue", label: "Before — Issue Description", type: "textarea", wide: true },
      { key: "beforeTraffic", label: "Before — Traffic Problem", type: "textarea", wide: true },
      { key: "beforeParking", label: "Before — Parking Problem", type: "textarea", wide: true },
      { key: "baseline", label: "Before — Baseline Note", type: "textarea", wide: true },
      { key: "beforeDocs", label: "Before — Photos / Map", type: "docs", wide: true },
      { key: "afterChange", label: "After — Change Implemented", type: "textarea", wide: true },
      { key: "afterResult", label: "After — Result", type: "textarea", wide: true },
      { key: "improvement", label: "After — Improvement Note", type: "textarea", wide: true },
      { key: "afterDocs", label: "After — New Photos / Updated Map", type: "docs", wide: true },
    ],
  },
};

export const ENTITY_ORDER: readonly EntityKey[] = [
  "activities",
  "siteVisits",
  "milestones",
  "actionItems",
  "recommendations",
  "notes",
  "beforeAfter",
];

export function hoursBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => !Number.isFinite(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export function fmtDay(key?: string | null): string {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (["completed", "implemented", "verified", "approved"].some((k) => s.includes(k)))
    return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
  if (["in progress", "recommended", "under review", "monitoring"].some((k) => s.includes(k)))
    return "border-sky-500/40 text-sky-300 bg-sky-500/10";
  if (["waiting", "on hold", "delayed", "follow-up"].some((k) => s.includes(k)))
    return "border-amber-500/40 text-amber-300 bg-amber-500/10";
  if (["not approved", "critical"].some((k) => s.includes(k)))
    return "border-red-500/40 text-red-300 bg-red-500/10";
  return "border-white/10 text-slate-300 bg-white/5";
}

export function priorityTone(priority?: string): string {
  switch (priority) {
    case "Critical":
      return "border-red-500/40 text-red-300 bg-red-500/10";
    case "High":
      return "border-orange-500/40 text-orange-300 bg-orange-500/10";
    case "Medium":
      return "border-amber-500/40 text-amber-300 bg-amber-500/10";
    case "Low":
      return "border-slate-500/40 text-slate-300 bg-white/5";
    default:
      return "border-white/10 text-slate-400 bg-white/5";
  }
}

export function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
