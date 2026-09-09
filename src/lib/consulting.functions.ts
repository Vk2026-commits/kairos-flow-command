import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveRole, type StaffRole } from "./staff.functions";
import { lookupDeviceRow, normalizeCode } from "./device-codes.server";

// Consulting Progress records are tied to staff accounts. Everyone signs in
// with their own account; hours, progress notes and assessments are private to
// the person who entered them. Full admins see everything.

type Row = Record<string, any>;

const ENTITIES = {
  activities: "consulting_activities",
  siteVisits: "consulting_site_visits",
  milestones: "consulting_milestones",
  actionItems: "consulting_action_items",
  recommendations: "consulting_recommendations",
  notes: "consulting_notes",
  beforeAfter: "consulting_before_after",
  briefings: "consulting_briefings",
} as const;

export type ConsultingEntity = keyof typeof ENTITIES;

/** Record types that belong to the person who entered them. */
const PRIVATE_ENTITIES: ConsultingEntity[] = ["activities", "notes", "briefings"];

/** What a contributor (add notes / log own hours) may create or edit. */
const CONTRIBUTOR_ENTITIES: ConsultingEntity[] = ["activities", "notes"];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function table(entity: unknown): string {
  const key = String(entity ?? "") as ConsultingEntity;
  const name = ENTITIES[key];
  if (!name) throw new Error("Unknown record type");
  return name;
}

function assertCanWrite(role: StaffRole, entity: ConsultingEntity) {
  if (role === "admin") return;
  if (role === "contributor" && CONTRIBUTOR_ENTITIES.includes(entity)) return;
  throw new Error("Your account has read-only access to this section");
}

export const loadConsulting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code?: string } | undefined) => data ?? {})
  .handler(async ({ context }) => {
    const db = await admin();
    const userId = context.userId as string;
    const role = await resolveRole(db, userId);

    const { data: profile } = await db
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const keys = Object.keys(ENTITIES) as ConsultingEntity[];
    const [project, ...lists] = await Promise.all([
      db.from("consulting_project").select("*").eq("id", "default").maybeSingle(),
      ...keys.map((key) => {
        let q = db.from(ENTITIES[key]).select("*");
        // Private sections: everyone but a full admin sees only their own
        // entries (plus shared historical records with no owner).
        if (role !== "admin" && PRIVATE_ENTITIES.includes(key)) {
          q = q.or(`owner_id.eq.${userId},owner_id.is.null`);
        }
        return q
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false });
      }),
    ]);

    const out: Record<string, Row[]> = {};
    keys.forEach((k, i) => {
      out[k] = ((lists[i] as any)?.data ?? []) as Row[];
    });

    if (role === "viewer") {
      out.notes = (out.notes ?? []).filter((n) => (n.status ?? "") !== "Admin Only");
    }

    return {
      role,
      label: (profile?.full_name as string) || (profile?.email as string) || "Staff account",
      userId,
      project: (project as any)?.data ?? null,
      records: out,
    };
  });

export const saveConsultingProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code?: string; project: Row }) => data)
  .handler(async ({ context, data }) => {
    const db = await admin();
    const role = await resolveRole(db, context.userId as string);
    if (role !== "admin") throw new Error("Only a full admin can edit the project summary");
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
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { code?: string; entity: ConsultingEntity; id?: string | null; record: Row }) => data,
  )
  .handler(async ({ context, data }) => {
    const db = await admin();
    const userId = context.userId as string;
    const role = await resolveRole(db, userId);
    const entity = String(data?.entity ?? "") as ConsultingEntity;
    assertCanWrite(role, entity);
    const t = table(entity);
    const r = data?.record ?? {};
    const patch: Row = {
      title: String(r.title ?? "").trim() || "Untitled",
      status: String(r.status ?? "").trim() || "Not Started",
      occurred_on: r.occurred_on ? String(r.occurred_on) : null,
      data: typeof r.data === "object" && r.data ? r.data : {},
    };

    if (data?.id) {
      let q = db.from(t).update(patch).eq("id", data.id);
      // Non-admins may only change their own entries.
      if (role !== "admin") q = q.eq("owner_id", userId);
      const { data: row, error } = await q.select().single();
      if (error || !row) throw new Error("Could not save that record");
      return { row: row as Row };
    }

    const { data: row, error } = await db
      .from(t)
      .insert({ ...patch, owner_id: userId })
      .select()
      .single();
    if (error) throw new Error("Could not save that record");
    return { row: row as Row };
  });

export const deleteConsultingRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code?: string; entity: ConsultingEntity; id: string }) => data)
  .handler(async ({ context, data }) => {
    const db = await admin();
    const userId = context.userId as string;
    const role = await resolveRole(db, userId);
    const entity = String(data?.entity ?? "") as ConsultingEntity;
    assertCanWrite(role, entity);
    let q = db.from(table(entity)).delete().eq("id", data?.id);
    if (role !== "admin") q = q.eq("owner_id", userId);
    const { error } = await q;
    if (error) throw new Error("Could not delete that record");
    return { ok: true as const };
  });

/** Legacy device-code roles (shared tablets) — still used by the Admin page. */
export const setDeviceRole = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; target: string; role: "admin" | "executive" | "security" | "parking" }) => data)
  .handler(async ({ data }) => {
    const db = await admin();
    const row = await lookupDeviceRow(db, data?.code, "code, revoked, role, label");
    if ((row.role ?? "admin") !== "admin") throw new Error("This device has view-only access");
    const target = normalizeCode(data?.target);
    const role = ["executive", "security", "parking"].includes(String(data?.role)) ? String(data?.role) : "admin";
    if (target === String(row.code) && role !== "admin") {
      throw new Error("You cannot downgrade the device you are using");
    }
    const { error } = await db.from("device_access_codes").update({ role }).eq("code", target);
    if (error) throw new Error("Could not update that device");
    return { ok: true as const };
  });
