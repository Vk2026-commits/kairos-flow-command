import { createServerFn } from "@tanstack/react-start";

// Uploaded documents are locked to invited devices, exactly like traffic plans.
// The browser never touches the documents table or the private storage bucket:
// every call carries a device access code that the server validates first.

type DocRow = Record<string, any>;

const BUCKET = "documents";
const MAX_BYTES = 12 * 1024 * 1024;

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

export const listDocuments = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const { data: rows, error } = await db
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load documents");
    const out: DocRow[] = [];
    for (const r of (rows ?? []) as DocRow[]) {
      const { data: signed } = await db.storage
        .from(BUCKET)
        .createSignedUrl(r.storage_path, 60 * 60 * 8);
      out.push({
        id: r.id,
        title: r.title,
        meta: r.meta ?? null,
        description: r.description ?? null,
        contentType: r.content_type ?? null,
        storagePath: r.storage_path,
        url: signed?.signedUrl ?? "",
      });
    }
    return { rows: out.filter((d) => d.url) };
  });

export const uploadDocument = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { code: string; name: string; contentType: string; size: number; base64: string }) => data,
  )
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const name = String(data?.name ?? "").trim();
    if (!name) throw new Error("File name is required");
    const base64 = String(data?.base64 ?? "");
    if (!base64) throw new Error("File is empty");

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_BYTES) throw new Error("File is larger than 12 MB");

    const contentType = String(data?.contentType || "application/octet-stream");
    const path = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, bytes, { contentType });
    if (upErr) throw new Error("Could not upload that file");

    const { error: insErr } = await db.from("documents").insert({
      title: name.replace(/\.[^.]+$/, ""),
      description: "Uploaded reference document.",
      meta: `Uploaded · ${(bytes.byteLength / 1024).toFixed(0)} KB · ${contentType}`,
      storage_path: path,
      content_type: contentType,
      file_size: bytes.byteLength,
    });
    if (insErr) {
      await db.storage.from(BUCKET).remove([path]);
      throw new Error("Could not save that document");
    }
    return { ok: true as const };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await requireDevice(data?.code);
    const { data: row, error } = await db
      .from("documents")
      .select("storage_path")
      .eq("id", data?.id)
      .maybeSingle();
    if (error || !row) throw new Error("Could not find that document");
    await db.storage.from(BUCKET).remove([row.storage_path]);
    const { error: delErr } = await db.from("documents").delete().eq("id", data?.id);
    if (delErr) throw new Error("Could not delete that document");
    return { ok: true as const };
  });
