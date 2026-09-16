import { createServerFn } from "@tanstack/react-start";
import { lookupDeviceRow } from "./device-codes.server";


// Shared board state (map annotations, landmarks, parking lots, fleet counts)
// is readable by anyone on the campus display, but only an invited admin
// device may change it. The browser therefore never writes the table directly:
// every save goes through here with a device access code the server validates.

const ALLOWED_KEY = /^[a-z0-9:_-]{3,80}$/i;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function requireAdminDevice(rawCode: unknown) {
  const db = await admin();
  const { deviceOrgId, signedInOrgId } = await import("./org.server");
  const row = await lookupDeviceRow(db, rawCode, "code, revoked, role, organization_id");
  if ((row.role ?? "admin") !== "admin") throw new Error("This device has view-only executive access");
  // A signed-in staff account works in the client they selected; shared campus
  // devices stay with the client their code belongs to.
  const signed = await signedInOrgId(db);
  return { db, orgId: signed ?? deviceOrgId(row) };
}

/** Board state is stored per client, so each client sees only its own board. */
async function orgForCode(rawCode: unknown): Promise<{ db: any; orgId: string }> {
  const db = await admin();
  const { deviceOrgId, signedInOrgId } = await import("./org.server");
  const signed = await signedInOrgId(db);
  if (signed) return { db, orgId: signed };
  if (typeof rawCode !== "string" || !rawCode) return { db, orgId: deviceOrgId(null) };
  try {
    const row = await lookupDeviceRow(db, rawCode, "code, revoked, organization_id");
    return { db, orgId: deviceOrgId(row) };
  } catch {
    return { db, orgId: deviceOrgId(null) };
  }
}

export const saveSharedState = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; key: string; data: unknown }) => data)
  .handler(async ({ data }) => {
    const { db, orgId } = await requireAdminDevice(data?.code);
    const key = String(data?.key ?? "");
    if (!ALLOWED_KEY.test(key)) throw new Error("Unknown state key");
    const payload = data?.data;
    if (payload === null || typeof payload !== "object") throw new Error("Invalid state payload");
    const { error } = await db
      .from("kairos_state")
      .upsert({ key, organization_id: orgId, data: payload }, { onConflict: "organization_id,key" });
    if (error) throw new Error("Could not save shared state");
    return { ok: true as const };
  });

// Reads mirror the table's public read policy, but go through the server so the
// browser never needs backend credentials of its own.
export const loadSharedState = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; code?: string }) => data)
  .handler(async ({ data }) => {
    const key = String(data?.key ?? "");
    if (!ALLOWED_KEY.test(key)) throw new Error("Unknown state key");
    const { db, orgId } = await orgForCode(data?.code);
    const { data: row, error } = await db
      .from("kairos_state")
      .select("data")
      .eq("organization_id", orgId)
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error("Could not load shared state");
    return { data: (row?.data ?? null) as Record<string, any> | null };
  });
