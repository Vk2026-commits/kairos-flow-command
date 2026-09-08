import { createServerFn } from "@tanstack/react-start";
import { codeKey, normalizeCode } from "./device-codes.server";

// Read-only health view of the access codes. It never reveals a full code:
// operators see a masked form so they can tell which record is which, plus a
// checker that explains exactly why a typed code is being refused.

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function mask(code: string): string {
  const c = String(code ?? "");
  if (c.length <= 4) return `${c.slice(0, 1)}***`;
  return `${c.slice(0, 3)}${"*".repeat(Math.max(2, c.length - 5))}${c.slice(-2)}`;
}

export type CodeStatusRow = {
  masked: string;
  label: string | null;
  role: string;
  state: "active-unused" | "active-used" | "revoked";
  lastUsedAt: string | null;
  createdAt: string | null;
};

export const listCodeStatus = createServerFn({ method: "POST" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db
    .from("device_access_codes")
    .select("code, label, revoked, role, last_used_at, created_at")
    .order("created_at", { ascending: true });
  if (error) return { rows: [] as CodeStatusRow[], reason: "Could not read the access code list" };
  const rows: CodeStatusRow[] = (data ?? []).map((r: any) => ({
    masked: mask(r.code),
    label: r.label ?? null,
    role: String(r.role ?? "admin"),
    state: r.revoked ? "revoked" : r.last_used_at ? "active-used" : "active-unused",
    lastUsedAt: r.last_used_at ?? null,
    createdAt: r.created_at ?? null,
  }));
  return { rows, reason: null as string | null };
});

export const diagnoseCode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    let typed: string;
    try {
      typed = normalizeCode(data?.code);
    } catch (e) {
      return { ok: false as const, verdict: (e as Error).message, detail: "Enter between 4 and 64 characters." };
    }
    const db = await admin();
    const { data: rows, error } = await db.from("device_access_codes").select("code, label, revoked, role, last_used_at");
    if (error) {
      return { ok: false as const, verdict: "The code list could not be read", detail: "The backend refused the request." };
    }
    const key = codeKey(typed);
    const row = (rows ?? []).find((r: any) => codeKey(String(r.code ?? "")) === key);
    if (!row) {
      return {
        ok: false as const,
        verdict: "No code on file matches what you typed",
        detail: `Nothing in the list matches "${typed}" (dashes, spaces and capitals are ignored when matching).`,
      };
    }
    if (row.revoked) {
      return {
        ok: false as const,
        verdict: "That code exists but has been switched off",
        detail: `${row.label || "Unlabelled device"} — restore it in Invited Devices to use it again.`,
      };
    }
    const exact = String(row.code) === typed;
    return {
      ok: true as const,
      verdict: "This code works",
      detail: `${row.label || "Unlabelled device"} · ${row.role} access · ${
        row.last_used_at ? `last used ${new Date(row.last_used_at).toLocaleString()}` : "never used before"
      }${exact ? "" : ` · stored as ${mask(String(row.code))}, matched loosely`}`,
    };
  });
