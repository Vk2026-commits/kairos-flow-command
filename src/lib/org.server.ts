// Server-only client (organization) resolution and audit helpers.
// The active client is NEVER trusted from the browser: a requested client id is
// only honoured when the signed-in account actually belongs to that client.

import { WHEELER_ORG_ID, type MemberRole } from "./org-constants";

export type OrgContext = {
  orgId: string;
  org: Record<string, any> | null;
  memberRole: MemberRole;
  isSuperAdmin: boolean;
  /** Legacy staff level, still used for consulting write permissions. */
  isKairos: boolean;
};

export async function isSuperAdmin(db: any, userId: string): Promise<boolean> {
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", userId);
  if ((roles ?? []).some((r: any) => String(r.role) === "admin")) return true;
  const { data: members } = await db
    .from("organization_members")
    .select("member_role, status")
    .eq("user_id", userId);
  return (members ?? []).some(
    (m: any) => m.member_role === "kairos_super_admin" && m.status === "active",
  );
}

/** Clients this account may work in. Super admins see every client. */
export async function listAccessibleOrgIds(db: any, userId: string): Promise<string[] | "all"> {
  if (await isSuperAdmin(db, userId)) return "all";
  const { data } = await db
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active");
  return (data ?? []).map((r: any) => String(r.organization_id));
}

/**
 * Links invitations that were created before the person had an account. An
 * invitation is matched on email only, so it can never grant access to a client
 * other than the one it was raised for.
 */
export async function claimPendingMemberships(db: any, userId: string, email: string | null) {
  if (!email) return;
  await db
    .from("organization_members")
    .update({ user_id: userId, invitation_status: "accepted" })
    .is("user_id", null)
    .ilike("email", email);
}

export async function resolveOrgContext(
  db: any,
  userId: string,
  requestedOrgId?: unknown,
): Promise<OrgContext> {
  const requested = typeof requestedOrgId === "string" && requestedOrgId ? requestedOrgId : null;

  const { data: profile } = await db
    .from("profiles")
    .select("active_org_id, email")
    .eq("id", userId)
    .maybeSingle();

  await claimPendingMemberships(db, userId, (profile?.email as string) ?? null);
  const superAdmin = await isSuperAdmin(db, userId);

  const { data: memberships } = await db
    .from("organization_members")
    .select("organization_id, member_role, status")
    .eq("user_id", userId)
    .eq("status", "active");
  const mine = (memberships ?? []) as Array<Record<string, any>>;

  const allowed = (id: string | null): boolean => {
    if (!id) return false;
    if (superAdmin) return true;
    return mine.some((m) => String(m.organization_id) === id);
  };

  let orgId =
    (allowed(requested) && requested) ||
    (allowed(profile?.active_org_id ?? null) && String(profile!.active_org_id)) ||
    (mine[0] ? String(mine[0].organization_id) : null) ||
    (superAdmin ? WHEELER_ORG_ID : null);

  if (!orgId) throw new Error("Your account is not linked to a client workspace yet");

  const { data: org } = await db.from("organizations").select("*").eq("id", orgId).maybeSingle();
  if (!org) {
    orgId = WHEELER_ORG_ID;
  }

  const membership = mine.find((m) => String(m.organization_id) === orgId);
  const memberRole: MemberRole = superAdmin
    ? "kairos_super_admin"
    : ((membership?.member_role as MemberRole) ?? "client_viewer");

  return {
    orgId,
    org: (org as Record<string, any>) ?? null,
    memberRole,
    isSuperAdmin: superAdmin,
    isKairos: memberRole === "kairos_super_admin" || memberRole === "kairos_consultant",
  };
}

export async function writeAudit(
  db: any,
  entry: {
    organizationId: string | null;
    userId?: string | null;
    actor?: string | null;
    action: string;
    recordType?: string | null;
    recordId?: string | null;
    recordLabel?: string | null;
    previousStatus?: string | null;
    newStatus?: string | null;
    details?: Record<string, any>;
  },
): Promise<void> {
  try {
    await db.from("audit_log").insert({
      organization_id: entry.organizationId,
      user_id: entry.userId ?? null,
      actor: entry.actor ?? null,
      action: entry.action,
      record_type: entry.recordType ?? null,
      record_id: entry.recordId ? String(entry.recordId) : null,
      record_label: entry.recordLabel ?? null,
      previous_status: entry.previousStatus ?? null,
      new_status: entry.newStatus ?? null,
      details: entry.details ?? {},
    });
  } catch {
    // Audit history must never block the operation it describes.
  }
}

/** Client that an access-code device belongs to (legacy tablet access). */
export function deviceOrgId(row: Record<string, any> | null | undefined): string {
  const id = row?.organization_id;
  return typeof id === "string" && id ? id : WHEELER_ORG_ID;
}
