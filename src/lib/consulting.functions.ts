import { createServerFn } from "@tanstack/react-start";

// Consulting Progress records live in their own tables and are locked to
// invited devices, exactly like traffic plans and documents. The browser never
// touches those tables: every call carries a device access code that the server
// validates first, and only codes with the "admin" role may write.

type Row = Record<string, any>;

const ENTITIES = {
  activities: "consulting_activities",
  siteVisits: "consulting_site_visits",
  milestones: "consulting_milestones",
  actionItems: "consulting_action_items",
  recommendations: "consulting_recommendations",
  notes: "consulting_notes",
  beforeAfter: "consulting_before_after",
} as const;

export type ConsultingEntity = keyof typeof ENTITIES;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function normalizeCode(input: unknown): string {
  if (typeof input !== "string") throw new Error("Missing device access code");
  const code = input.trim().toUpperCase();
  if (code.length < 4 || code.length > 64) throw new Error("Invalid device access code");
  return code;
}

async function requireDevice(rawCode: unknown) {
  const code = normalizeCode(rawCode);
  const db = await admin();
  const { data, error } = await db
    .from("device_access_codes")
    .select("code, revoked, role, label")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("Could not verify device access");
  if (!data || data.revoked) throw new Error("This device is not invited");
  void db.from("device_access_codes").update({ last_used_at: new Date().toISOString() }).eq("code", code);
  const role = (data.role ?? "admin") as string;
  if (role !== "admin" && role !== "executive") {
    throw new Error("This device does not have access to Consulting Progress");
  }
  return { code, db, role: role as "admin" | "executive", label: data.label ?? null };
}

async function requireAdmin(rawCode: unknown) {
  const ctx = await requireDevice(rawCode);
  if (ctx.role !== "admin") throw new Error("This device has view-only executive access");
  return ctx;
}

function table(entity: unknown): string {
  const key = String(entity ?? "") as ConsultingEntity;
  const name = ENTITIES[key];
  if (!name) throw new Error("Unknown record type");
  return name;
}

export const loadConsulting = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { db, role, label } = await requireDevice(data?.code);

    const [project, ...lists] = await Promise.all([
      db.from("consulting_project").select("*").eq("id", "default").maybeSingle(),
      ...Object.values(ENTITIES).map((t) =>
        db.from(t).select("*").order("occurred_on", { ascending: false }).order("created_at", { ascending: false }),
      ),
    ]);

    const keys = Object.keys(ENTITIES) as ConsultingEntity[];
    const out: Record<string, Row[]> = {};
    keys.forEach((k, i) => {
      out[k] = ((lists[i] as any)?.data ?? []) as Row[];
    });

    // Executives never see admin-only progress notes.
    if (role !== "admin") {
      out.notes = (out.notes ?? []).filter((n) => (n.status ?? "") !== "Admin Only");
    }

    return {
      role,
      label,
      project: (project as any)?.data ?? null,
      records: out,
    };
  });

export const saveConsultingProject = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; project: Row }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireAdmin(data?.code);
    const p = data?.project ?? {};
    const patch: Row = {
      id: "default",
      status: String(p.status ?? "Assessment"),
      phase: String(p.phase ?? ""),
      progress_pct: Math.max(0, Math.min(100, Math.floor(Number(p.progress_pct) || 0))),
      next_action: p.next_action ? String(p.next_action) : null,
      summary: p.summary ? String(p.summary) : null,
      data: typeof p.data === "object" && p.data ? p.data : {},
    };
    const { data: row, error } = await db.from("consulting_project").upsert(patch).select().single();
    if (error) throw new Error("Could not save the project summary");
    return { row: row as Row };
  });

export const saveConsultingRecord = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; entity: ConsultingEntity; id?: string | null; record: Row }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireAdmin(data?.code);
    const t = table(data?.entity);
    const r = data?.record ?? {};
    const patch: Row = {
      title: String(r.title ?? "").trim() || "Untitled",
      status: String(r.status ?? "").trim() || "Not Started",
      occurred_on: r.occurred_on ? String(r.occurred_on) : null,
      data: typeof r.data === "object" && r.data ? r.data : {},
    };
    const query = data?.id
      ? db.from(t).update(patch).eq("id", data.id).select().single()
      : db.from(t).insert(patch).select().single();
    const { data: row, error } = await query;
    if (error) throw new Error("Could not save that record");
    return { row: row as Row };
  });

export const deleteConsultingRecord = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; entity: ConsultingEntity; id: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireAdmin(data?.code);
    const t = table(data?.entity);
    const { error } = await db.from(t).delete().eq("id", data?.id);
    if (error) throw new Error("Could not delete that record");
    return { ok: true as const };
  });

export const setDeviceRole = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; target: string; role: "admin" | "executive" | "security" | "parking" }) => data)
  .handler(async ({ data }) => {
    const { code, db } = await requireAdmin(data?.code);
    const target = normalizeCode(data?.target);
    const role = ["executive", "security", "parking"].includes(String(data?.role)) ? String(data?.role) : "admin";
    if (target === code && role !== "admin") throw new Error("You cannot downgrade the device you are using");
    const { error } = await db.from("device_access_codes").update({ role }).eq("code", target);
    if (error) throw new Error("Could not update that device");
    return { ok: true as const };
  });
