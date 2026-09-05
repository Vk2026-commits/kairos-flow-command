import { createServerFn } from "@tanstack/react-start";

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
  if (typeof rawCode !== "string") throw new Error("Missing device access code");
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4 || code.length > 64) throw new Error("Invalid device access code");
  const db = await admin();
  const { data, error } = await db
    .from("device_access_codes")
    .select("code, revoked, role")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("Could not verify device access");
  if (!data || data.revoked) throw new Error("This device is not invited");
  if ((data.role ?? "admin") !== "admin") throw new Error("This device has view-only executive access");
  return db;
}

export const saveSharedState = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; key: string; data: unknown }) => data)
  .handler(async ({ data }) => {
    const db = await requireAdminDevice(data?.code);
    const key = String(data?.key ?? "");
    if (!ALLOWED_KEY.test(key)) throw new Error("Unknown state key");
    const payload = data?.data;
    if (payload === null || typeof payload !== "object") throw new Error("Invalid state payload");
    const { error } = await db.from("kairos_state").upsert({ key, data: payload });
    if (error) throw new Error("Could not save shared state");
    return { ok: true as const };
  });

// Reads mirror the table's public read policy, but go through the server so the
// browser never needs backend credentials of its own.
export const loadSharedState = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string }) => data)
  .handler(async ({ data }) => {
    const key = String(data?.key ?? "");
    if (!ALLOWED_KEY.test(key)) throw new Error("Unknown state key");
    const db = await admin();
    const { data: row, error } = await db
      .from("kairos_state")
      .select("data")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error("Could not load shared state");
    return { data: (row?.data ?? null) as unknown };
  });
