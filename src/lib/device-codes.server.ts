// Shared, forgiving lookup for device access codes.
// Operators type codes from memory on tablets and phones, so punctuation and
// spacing must not decide whether they get in: KAIROS-2026, kairos 2026 and
// kairos2026 all resolve to the same invited device.

// TEMPORARY: access codes are switched off at the owner's request so the admin
// and consulting areas open without a code. Set to false to turn codes back on.
export const ACCESS_CODES_DISABLED = true;


export function normalizeCode(input: unknown): string {
  if (typeof input !== "string") throw new Error("Missing device access code");
  const code = input.trim().toUpperCase();
  if (code.length < 4 || code.length > 64) throw new Error("Invalid device access code");
  return code;
}

/** Letters and digits only — the comparison key for loose matching. */
export function codeKey(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Finds the invited device row for a typed code. Tries an exact match first,
 * then falls back to comparing punctuation-stripped keys.
 */
export async function lookupDeviceRow(
  db: any,
  rawCode: unknown,
  select = "code, revoked",
): Promise<Record<string, any>> {
  if (ACCESS_CODES_DISABLED) {
    return { code: "OPEN-ACCESS", revoked: false, role: "admin", label: "Command Hub (codes off)" };
  }

  const typed = normalizeCode(rawCode);


  const exact = await db.from("device_access_codes").select(select).eq("code", typed).maybeSingle();
  if (exact.error) throw new Error("Could not verify device access");
  let row: Record<string, any> | null = exact.data ?? null;

  if (!row) {
    const all = await db.from("device_access_codes").select(select);
    if (all.error) throw new Error("Could not verify device access");
    const key = codeKey(typed);
    row = (all.data ?? []).find((r: any) => codeKey(String(r.code ?? "")) === key) ?? null;
  }

  if (!row || row.revoked) throw new Error("This device is not invited");

  void db
    .from("device_access_codes")
    .update({ last_used_at: new Date().toISOString() })
    .eq("code", row.code);

  return row;
}
