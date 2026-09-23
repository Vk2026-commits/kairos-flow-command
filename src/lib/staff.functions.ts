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
    const { data: clients } = await db
      .from("organizations")
      .select("id, name")
      .order("name", { ascending: true });
    const { data: members } = await db
      .from("organization_members")
      .select("user_id, organization_id, member_role, status");

    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = byUser.get(String(r.user_id)) ?? [];
      list.push(String(r.role));
      byUser.set(String(r.user_id), list);
    }

    const orgsByUser = new Map<string, string[]>();
    const memberRoleByUser = new Map<string, string>();
    for (const m of members ?? []) {
      if (!m.user_id || String(m.status) !== "active") continue;
      const key = String(m.user_id);
      const list = orgsByUser.get(key) ?? [];
      list.push(String(m.organization_id));
      orgsByUser.set(key, list);
      if (!memberRoleByUser.has(key)) memberRoleByUser.set(key, String(m.member_role));
    }

    return {
      clients: (clients ?? []).map((c: any) => ({ id: String(c.id), name: String(c.name ?? "") })),
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
          orgIds: orgsByUser.get(String(p.id)) ?? [],
          memberRole: memberRoleByUser.get(String(p.id)) ?? null,
          isMe: String(p.id) === context.userId,
        };
      }),
    };
  });

const CLIENT_MEMBER_ROLES = [
  "client_admin",
  "client_leadership",
  "client_viewer",
  "field_user",
  "kairos_consultant",
  "kairos_super_admin",
] as const;
type AssignRole = (typeof CLIENT_MEMBER_ROLES)[number];

/**
 * Admin only: decide exactly which client sites a person may open. Replacing the
 * list is the whole permission — nothing outside these clients is ever visible
 * to them, because every read resolves the client from this membership table.
 */
async function applyClientAccess(
  db: any,
  userId: string,
  orgIds: string[],
  memberRole: AssignRole,
) {
  const wanted = Array.from(new Set(orgIds.filter(Boolean).map(String)));
  const { data: existing } = await db
    .from("organization_members")
    .select("id, organization_id")
    .eq("user_id", userId);

  for (const row of existing ?? []) {
    if (!wanted.includes(String(row.organization_id))) {
      await db.from("organization_members").delete().eq("id", row.id);
    }
  }
  const have = new Set((existing ?? []).map((r: any) => String(r.organization_id)));
  const { data: profile } = await db
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  for (const orgId of wanted) {
    if (have.has(orgId)) {
      await db
        .from("organization_members")
        .update({ member_role: memberRole, status: "active", invitation_status: "accepted" })
        .eq("user_id", userId)
        .eq("organization_id", orgId);
    } else {
      await db.from("organization_members").insert({
        organization_id: orgId,
        user_id: userId,
        email: profile?.email ?? null,
        full_name: profile?.full_name ?? null,
        member_role: memberRole,
        status: "active",
        invitation_status: "accepted",
      });
    }
  }

  if (wanted.length) {
    await db.from("profiles").update({ active_org_id: wanted[0] }).eq("id", userId);
  } else {
    await db.from("profiles").update({ active_org_id: null }).eq("id", userId);
  }
}

export const setStaffClientAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; orgIds: string[]; memberRole?: AssignRole }) => data)
  .handler(async ({ context, data }) => {
    const db = await adminDb();
    const me = context.userId as string;
    if ((await resolveRole(db, me)) !== "admin") {
      throw new Error("Only a full admin can assign client sites");
    }
    const target = String(data?.userId ?? "");
    if (!target) throw new Error("Missing account");

    const memberRole: AssignRole = CLIENT_MEMBER_ROLES.includes(data?.memberRole as AssignRole)
      ? (data!.memberRole as AssignRole)
      : "client_leadership";
    const orgIds = Array.isArray(data?.orgIds) ? data!.orgIds.map(String) : [];

    // A person tied to one client must not keep platform-wide admin rights,
    // which would let them switch into every other client.
    if (target !== me && orgIds.length && memberRole !== "kairos_super_admin") {
      const { data: roles } = await db.from("user_roles").select("role").eq("user_id", target);
      if ((roles ?? []).some((r: any) => String(r.role) === "admin")) {
        await db.from("user_roles").delete().eq("user_id", target);
        await db.from("user_roles").insert({ user_id: target, role: "contributor" });
      }
    }

    await applyClientAccess(db, target, orgIds, memberRole);
    return { ok: true as const, orgIds };
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
