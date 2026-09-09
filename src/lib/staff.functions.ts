import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Staff accounts: every executive and consultant signs in with their own
// account. Permission level decides what they can do:
//   admin       — full access, sees everyone's hours and assessments
//   contributor — logs their own hours and adds notes; sees only their own
//   viewer      — read-only
export type StaffRole = "admin" | "contributor" | "viewer";

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Full admin",
  contributor: "Add notes & log own hours",
  viewer: "Read only",
};

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export async function resolveRole(db: any, userId: string): Promise<StaffRole> {
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => String(r.role));
  if (roles.includes("admin")) return "admin";
  if (roles.includes("contributor")) return "contributor";
  return "viewer";
}

/** Who am I and what may I do? */
export const getMyStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminDb();
    const userId = context.userId as string;
    const role = await resolveRole(db, userId);
    const { data: profile } = await db
      .from("profiles")
      .select("id, email, full_name, title")
      .eq("id", userId)
      .maybeSingle();
    return {
      userId,
      role,
      email: (profile?.email as string) ?? ((context.claims as any)?.email ?? null),
      fullName: (profile?.full_name as string) ?? null,
      title: (profile?.title as string) ?? null,
    };
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fullName?: string; title?: string }) => data)
  .handler(async ({ context, data }) => {
    const db = await adminDb();
    const userId = context.userId as string;
    const { error } = await db
      .from("profiles")
      .update({
        full_name: data?.fullName ? String(data.fullName).slice(0, 120) : null,
        title: data?.title ? String(data.title).slice(0, 120) : null,
      })
      .eq("id", userId);
    if (error) throw new Error("Could not save your details");
    return { ok: true as const };
  });

/** Admin only: everyone's account and permission level. */
export const listStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminDb();
    const role = await resolveRole(db, context.userId as string);
    if (role !== "admin") throw new Error("Only a full admin can manage staff accounts");

    const { data: profiles } = await db
      .from("profiles")
      .select("id, email, full_name, title, created_at")
      .order("created_at", { ascending: true });
    const { data: roles } = await db.from("user_roles").select("user_id, role");

    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = byUser.get(String(r.user_id)) ?? [];
      list.push(String(r.role));
      byUser.set(String(r.user_id), list);
    }

    return {
      staff: (profiles ?? []).map((p: any) => {
        const list = byUser.get(String(p.id)) ?? [];
        const level: StaffRole = list.includes("admin")
          ? "admin"
          : list.includes("contributor")
            ? "contributor"
            : "viewer";
        return {
          id: String(p.id),
          email: p.email ?? null,
          fullName: p.full_name ?? null,
          title: p.title ?? null,
          createdAt: p.created_at ?? null,
          role: level,
          isMe: String(p.id) === context.userId,
        };
      }),
    };
  });

/** Admin only: create a staff account with a starting permission level. */
export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { email: string; password: string; fullName?: string; title?: string; role?: StaffRole }) => data,
  )
  .handler(async ({ context, data }) => {
    const db = await adminDb();
    const myRole = await resolveRole(db, context.userId as string);
    if (myRole !== "admin") throw new Error("Only a full admin can create staff accounts");

    const email = String(data?.email ?? "").trim().toLowerCase();
    const password = String(data?.password ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    if (password.length < 8) throw new Error("Use a temporary password of at least 8 characters");

    const role = (["admin", "contributor", "viewer"] as StaffRole[]).includes(data?.role as StaffRole)
      ? (data!.role as StaffRole)
      : "viewer";
    const fullName = data?.fullName ? String(data.fullName).slice(0, 120) : null;
    const title = data?.title ? String(data.title).slice(0, 120) : null;

    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created?.user) {
      throw new Error(
        /already/i.test(error?.message ?? "")
          ? "That email already has an account"
          : "Could not create that account",
      );
    }

    const newId = created.user.id as string;
    await db.from("profiles").upsert({ id: newId, email, full_name: fullName, title });
    await db.from("user_roles").delete().eq("user_id", newId);
    await db.from("user_roles").insert({ user_id: newId, role });

    return { ok: true as const, id: newId, email, role };
  });

/** Admin only: change someone's permission level. */
export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; role: StaffRole }) => data)
  .handler(async ({ context, data }) => {
    const db = await adminDb();
    const me = context.userId as string;
    const myRole = await resolveRole(db, me);
    if (myRole !== "admin") throw new Error("Only a full admin can change permissions");

    const target = String(data?.userId ?? "");
    const role = (["admin", "contributor", "viewer"] as StaffRole[]).includes(data?.role as StaffRole)
      ? (data.role as StaffRole)
      : "viewer";
    if (!target) throw new Error("Missing account");
    if (target === me && role !== "admin") {
      throw new Error("You cannot remove your own admin access");
    }

    await db.from("user_roles").delete().eq("user_id", target);
    const { error } = await db.from("user_roles").insert({ user_id: target, role });
    if (error) throw new Error("Could not change that permission level");
    return { ok: true as const, role };
  });
