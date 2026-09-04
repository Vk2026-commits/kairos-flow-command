import { createServerFn } from "@tanstack/react-start";

// Traffic plans are locked to invited devices. The browser never touches the
// table directly: every call carries a device access code that the server
// validates against public.device_access_codes before doing any work.

type PlanRow = Record<string, any>;

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
    .select("code, revoked")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("Could not verify device access");
  if (!data || data.revoked) throw new Error("This device is not invited");
  void db.from("device_access_codes").update({ last_used_at: new Date().toISOString() }).eq("code", code);
  return { code, db };
}

export const verifyDeviceCode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { code } = await requireDevice(data?.code);
    return { ok: true as const, code };
  });

export const listTrafficPlans = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const { data: rows, error } = await db
      .from("traffic_plans")
      .select("*")
      .order("saved_at", { ascending: false });
    if (error) throw new Error("Could not load traffic plans");
    return { rows: (rows ?? []) as PlanRow[] };
  });

export const upsertTrafficPlan = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id?: string | null; plan: PlanRow }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const plan = data?.plan ?? {};
    if (typeof plan.name !== "string" || !plan.name.trim()) throw new Error("Plan name is required");
    const query = data?.id
      ? db.from("traffic_plans").update(plan).eq("id", data.id).select().single()
      : db.from("traffic_plans").insert(plan).select().single();
    const { data: row, error } = await query;
    if (error) throw new Error("Could not save traffic plan");
    return { row: row as PlanRow };
  });

export const renameTrafficPlan = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id: string; name: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const name = String(data?.name ?? "").trim();
    if (!name) throw new Error("Plan name is required");
    const { error } = await db.from("traffic_plans").update({ name }).eq("id", data.id);
    if (error) throw new Error("Could not rename traffic plan");
    return { ok: true as const };
  });

export const deleteTrafficPlan = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const { error } = await db.from("traffic_plans").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete traffic plan");
    return { ok: true as const };
  });

export const importLegacyTrafficPlans = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; plans: PlanRow[] }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const plans = Array.isArray(data?.plans) ? data.plans : [];
    if (plans.length === 0) return { inserted: 0 };
    const { error } = await db.from("traffic_plans").insert(plans);
    if (error) throw new Error("Could not import saved plans");
    return { inserted: plans.length };
  });
