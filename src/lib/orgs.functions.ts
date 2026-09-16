import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACCOUNT_STATUSES,
  ALL_MODULES_ON,
  CLIENT_TYPES,
  MEMBER_ROLES,
  type ClientSummary,
  type MemberRole,
} from "./org-constants";

// Every consulting client is an "organization". Kairos staff may switch between
// clients; a client's own people only ever see their own organization. The
// active client is resolved on the server from membership, never from the
// browser, so URL or request tampering cannot cross clients.

type Row = Record<string, any>;

const LOGO_BUCKET = "client-logos";

async function ctx(userId: string, orgId?: unknown) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { resolveOrgContext } = await import("./org.server");
  const db = supabaseAdmin as any;
  const context = await resolveOrgContext(db, userId, orgId);
  return { db, ...context };
}

function logoUrl(db: any, path: string | null): string | null {
  if (!path) return null;
  const { data } = db.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return (data?.publicUrl as string) ?? null;
}

function toSummary(db: any, row: Row): ClientSummary {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    clientType: String(row.client_type ?? ""),
    projectName: row.project_name ?? null,
    accountStatus: String(row.account_status ?? "Setup"),
    logoUrl: logoUrl(db, row.logo_path ?? null),
    modules: (row.modules as Record<string, boolean>) ?? {},
    primaryContact: row.primary_contact ?? null,
    contactTitle: row.contact_title ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zip: row.zip ?? null,
    website: row.website ?? null,
    contractStart: row.contract_start ?? null,
    contractEnd: row.contract_end ?? null,
    internalNotes: row.internal_notes ?? null,
  };
}

/** Which clients may I work in, and which one am I in right now? */
export const listMyClients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId?: string } | undefined) => data ?? {})
  .handler(async ({ context, data }) => {
    const { db, orgId, memberRole, isSuperAdmin, isKairos } = await ctx(
      context.userId as string,
      data?.orgId,
    );

    let query = db.from("organizations").select("*").order("name", { ascending: true });
    if (!isSuperAdmin) {
      const { data: mine } = await db
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", context.userId)
        .eq("status", "active");
      const ids = (mine ?? []).map((m: any) => String(m.organization_id));
      query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    const { data: rows } = await query;

    return {
      clients: ((rows ?? []) as Row[]).map((r) => toSummary(db, r)),
      activeOrgId: orgId,
      memberRole,
      isSuperAdmin,
      isKairos,
    };
  });

export const setActiveClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId: string }) => data)
  .handler(async ({ context, data }) => {
    const userId = context.userId as string;
    const { db, orgId } = await ctx(userId, data?.orgId);
    if (orgId !== data?.orgId) throw new Error("You do not have access to that client");
    await db.from("profiles").update({ active_org_id: orgId }).eq("id", userId);
    return { ok: true as const, orgId };
  });

type ClientInput = {
  id?: string | null;
  name: string;
  clientType?: string;
  primaryContact?: string;
  contactTitle?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  projectName?: string;
  contractStart?: string;
  contractEnd?: string;
  accountStatus?: string;
  internalNotes?: string;
  modules?: Record<string, boolean>;
  logoBase64?: string | null;
  logoName?: string | null;
  logoContentType?: string | null;
  invites?: Array<{ email: string; role: MemberRole; fullName?: string }>;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

/** Kairos admin only: create or update a client and its empty workspace. */
export const saveClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ClientInput) => data)
  .handler(async ({ context, data }) => {
    const userId = context.userId as string;
    const { db, isSuperAdmin } = await ctx(userId);
    if (!isSuperAdmin) throw new Error("Only a Kairos super admin can manage clients");

    const name = String(data?.name ?? "").trim();
    if (!name) throw new Error("Organization name is required");

    const patch: Row = {
      name,
      slug: slugify(name),
      client_type: CLIENT_TYPES.includes(data?.clientType as any)
        ? data!.clientType
        : "Church / Ministry",
      primary_contact: data?.primaryContact?.trim() || null,
      contact_title: data?.contactTitle?.trim() || null,
      email: data?.email?.trim() || null,
      phone: data?.phone?.trim() || null,
      address: data?.address?.trim() || null,
      city: data?.city?.trim() || null,
      state: data?.state?.trim() || null,
      zip: data?.zip?.trim() || null,
      website: data?.website?.trim() || null,
      project_name: data?.projectName?.trim() || null,
      contract_start: data?.contractStart || null,
      contract_end: data?.contractEnd || null,
      account_status: ACCOUNT_STATUSES.includes(data?.accountStatus as any)
        ? data!.accountStatus
        : "Setup",
      internal_notes: data?.internalNotes?.trim() || null,
      modules:
        data?.modules && typeof data.modules === "object" ? data.modules : { ...ALL_MODULES_ON },
    };

    let row: Row;
    if (data?.id) {
      const { data: updated, error } = await db
        .from("organizations")
        .update(patch)
        .eq("id", data.id)
        .select()
        .single();
      if (error || !updated) throw new Error("Could not save that client");
      row = updated as Row;
    } else {
      const { data: created, error } = await db
        .from("organizations")
        .insert(patch)
        .select()
        .single();
      if (error || !created) throw new Error("Could not create that client");
      row = created as Row;

      // The person creating the client keeps access to it.
      await db.from("organization_members").insert({
        organization_id: row.id,
        user_id: userId,
        member_role: "kairos_super_admin",
        status: "active",
        invitation_status: "accepted",
      });
      // Every other Kairos super admin can switch into the new client too.
      const { data: admins } = await db.from("user_roles").select("user_id").eq("role", "admin");
      for (const a of admins ?? []) {
        if (String(a.user_id) === userId) continue;
        await db.from("organization_members").insert({
          organization_id: row.id,
          user_id: a.user_id,
          member_role: "kairos_super_admin",
          status: "active",
          invitation_status: "accepted",
        });
      }
    }

    // Optional logo
    if (data?.logoBase64) {
      const bytes = Uint8Array.from(atob(String(data.logoBase64)), (c) => c.charCodeAt(0));
      if (bytes.byteLength <= 4 * 1024 * 1024) {
        const safe = String(data.logoName ?? "logo.png").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${row.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await db.storage
          .from(LOGO_BUCKET)
          .upload(path, bytes, { contentType: data.logoContentType || "image/png", upsert: true });
        if (!upErr) {
          const { data: withLogo } = await db
            .from("organizations")
            .update({ logo_path: path })
            .eq("id", row.id)
            .select()
            .single();
          if (withLogo) row = withLogo as Row;
        }
      }
    }

    // Optional invitations — always bound to this client only.
    const invites = Array.isArray(data?.invites) ? data!.invites! : [];
    for (const invite of invites) {
      const email = String(invite?.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      const role = MEMBER_ROLES.includes(invite?.role) ? invite.role : "client_viewer";
      await inviteMember(db, String(row.id), email, role, invite?.fullName ?? null);
    }

    const { writeAudit } = await import("./org.server");
    await writeAudit(db, {
      organizationId: String(row.id),
      userId,
      action: data?.id ? "Updated client" : "Created client",
      recordType: "organization",
      recordId: String(row.id),
      recordLabel: name,
      newStatus: String(row.account_status),
    });

    return { client: toSummary(db, row) };
  });

async function inviteMember(
  db: any,
  organizationId: string,
  email: string,
  role: MemberRole,
  fullName: string | null,
) {
  // Link an existing account when there is one; otherwise the row waits for the
  // person to sign up with that email address.
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name")
    .ilike("email", email)
    .maybeSingle();

  await db.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: profile?.id ?? null,
      email,
      full_name: fullName || profile?.full_name || null,
      member_role: role,
      status: "active",
      invitation_status: profile?.id ? "accepted" : "invited",
      invited_at: new Date().toISOString(),
    },
    { onConflict: profile?.id ? "organization_id,user_id" : undefined as any },
  );

  if (!profile?.id) {
    try {
      await db.auth.admin.inviteUserByEmail(email);
    } catch {
      // Email delivery is optional: the membership already waits for sign-up.
    }
  }
}

export const archiveClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId: string; status?: string }) => data)
  .handler(async ({ context, data }) => {
    const userId = context.userId as string;
    const { db, isSuperAdmin } = await ctx(userId);
    if (!isSuperAdmin) throw new Error("Only a Kairos super admin can archive clients");
    const status = ACCOUNT_STATUSES.includes(data?.status as any) ? data!.status! : "Archived";
    const { data: before } = await db
      .from("organizations")
      .select("account_status, name")
      .eq("id", data?.orgId)
      .maybeSingle();
    const { error } = await db
      .from("organizations")
      .update({ account_status: status })
      .eq("id", data?.orgId);
    if (error) throw new Error("Could not change that client's status");
    const { writeAudit } = await import("./org.server");
    await writeAudit(db, {
      organizationId: String(data?.orgId),
      userId,
      action: `Client status changed to ${status}`,
      recordType: "organization",
      recordId: String(data?.orgId),
      recordLabel: (before?.name as string) ?? null,
      previousStatus: (before?.account_status as string) ?? null,
      newStatus: status,
    });
    return { ok: true as const, status };
  });

// ===================== Client users =====================

export const listClientUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId?: string } | undefined) => data ?? {})
  .handler(async ({ context, data }) => {
    const { db, orgId, memberRole, isSuperAdmin } = await ctx(
      context.userId as string,
      data?.orgId,
    );
    if (!isSuperAdmin && memberRole !== "client_admin" && memberRole !== "kairos_consultant") {
      throw new Error("You do not have permission to manage users for this client");
    }
    const { data: rows } = await db
      .from("organization_members")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });

    const ids = ((rows ?? []) as Row[]).map((r) => r.user_id).filter(Boolean);
    const profiles = ids.length
      ? ((await db.from("profiles").select("id, email, full_name, title").in("id", ids)).data ?? [])
      : [];
    const byId = new Map(profiles.map((p: any) => [String(p.id), p]));

    return {
      orgId,
      canManage: true,
      members: ((rows ?? []) as Row[]).map((r) => {
        const p = r.user_id ? byId.get(String(r.user_id)) : null;
        return {
          id: String(r.id),
          userId: r.user_id ? String(r.user_id) : null,
          name: (r.full_name as string) || (p?.full_name as string) || null,
          email: (r.email as string) || (p?.email as string) || null,
          role: String(r.member_role) as MemberRole,
          status: String(r.status),
          invitationStatus: String(r.invitation_status),
          lastLoginAt: r.last_login_at ?? null,
          isMe: r.user_id ? String(r.user_id) === context.userId : false,
        };
      }),
    };
  });

export const inviteClientUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId?: string; email: string; role: MemberRole; fullName?: string }) => data)
  .handler(async ({ context, data }) => {
    const userId = context.userId as string;
    const { db, orgId, memberRole, isSuperAdmin } = await ctx(userId, data?.orgId);
    if (!isSuperAdmin && memberRole !== "client_admin") {
      throw new Error("You do not have permission to invite users for this client");
    }
    const email = String(data?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    let role: MemberRole = MEMBER_ROLES.includes(data?.role) ? data.role : "client_viewer";
    // A client admin can never mint Kairos-level access.
    if (!isSuperAdmin && (role === "kairos_super_admin" || role === "kairos_consultant")) {
      role = "client_admin";
    }
    await inviteMember(db, orgId, email, role, data?.fullName ?? null);
    const { writeAudit } = await import("./org.server");
    await writeAudit(db, {
      organizationId: orgId,
      userId,
      action: "Invited user",
      recordType: "organization_member",
      recordLabel: email,
      newStatus: role,
    });
    return { ok: true as const };
  });

export const updateClientUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId?: string; memberId: string; role?: MemberRole; status?: string }) => data)
  .handler(async ({ context, data }) => {
    const userId = context.userId as string;
    const { db, orgId, memberRole, isSuperAdmin } = await ctx(userId, data?.orgId);
    if (!isSuperAdmin && memberRole !== "client_admin") {
      throw new Error("You do not have permission to change users for this client");
    }
    const { data: member } = await db
      .from("organization_members")
      .select("*")
      .eq("id", data?.memberId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!member) throw new Error("That user is not part of this client");
    if (String(member.user_id ?? "") === userId && data?.status === "disabled") {
      throw new Error("You cannot disable your own access");
    }

    const patch: Row = {};
    if (data?.role) {
      let role: MemberRole = MEMBER_ROLES.includes(data.role) ? data.role : "client_viewer";
      if (!isSuperAdmin && (role === "kairos_super_admin" || role === "kairos_consultant")) {
        role = "client_admin";
      }
      patch.member_role = role;
    }
    if (data?.status && ["active", "disabled"].includes(data.status)) patch.status = data.status;
    if (Object.keys(patch).length === 0) return { ok: true as const };

    const { error } = await db
      .from("organization_members")
      .update(patch)
      .eq("id", data?.memberId)
      .eq("organization_id", orgId);
    if (error) throw new Error("Could not update that user");

    const { writeAudit } = await import("./org.server");
    await writeAudit(db, {
      organizationId: orgId,
      userId,
      action: patch.status ? `User access ${patch.status}` : "Changed user role",
      recordType: "organization_member",
      recordId: String(data?.memberId),
      recordLabel: (member.email as string) ?? null,
      previousStatus: String(member.member_role),
      newStatus: String(patch.member_role ?? member.member_role),
    });
    return { ok: true as const };
  });

export const resendClientInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId?: string; memberId: string }) => data)
  .handler(async ({ context, data }) => {
    const { db, orgId, memberRole, isSuperAdmin } = await ctx(context.userId as string, data?.orgId);
    if (!isSuperAdmin && memberRole !== "client_admin") {
      throw new Error("You do not have permission to invite users for this client");
    }
    const { data: member } = await db
      .from("organization_members")
      .select("email, user_id")
      .eq("id", data?.memberId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!member?.email) throw new Error("That invitation has no email address");
    if (member.user_id) return { ok: true as const, alreadyActive: true as const };
    try {
      await db.auth.admin.inviteUserByEmail(String(member.email));
    } catch {
      throw new Error("Could not send that invitation email");
    }
    await db
      .from("organization_members")
      .update({ invited_at: new Date().toISOString(), invitation_status: "invited" })
      .eq("id", data?.memberId);
    return { ok: true as const, alreadyActive: false as const };
  });

// ===================== Kairos Portfolio =====================

export const kairosPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, isSuperAdmin } = await ctx(context.userId as string);
    if (!isSuperAdmin) throw new Error("The Kairos Portfolio is available to Kairos admins only");

    const { data: orgs } = await db
      .from("organizations")
      .select("*")
      .order("name", { ascending: true });

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    const monthISO = monthStart.toISOString().slice(0, 10);

    const [actions, decisions, visits, briefings, activities, projects] = await Promise.all([
      db.from("consulting_action_items").select("organization_id, status, data, updated_at"),
      db.from("consulting_decisions").select("organization_id, status, updated_at"),
      db.from("consulting_site_visits").select("organization_id, occurred_on, status"),
      db.from("consulting_briefings").select("organization_id, occurred_on, title, updated_at"),
      db.from("consulting_activities").select("organization_id, occurred_on, data, updated_at"),
      db.from("consulting_project").select("organization_id, status, phase, next_action"),
    ]);

    const byOrg = <T extends Row>(rows: T[] | null | undefined, id: string) =>
      (rows ?? []).filter((r) => String(r.organization_id) === id);

    const openish = (s: string) => !/complete|done|verified|closed/i.test(s);
    const today = new Date().toISOString().slice(0, 10);

    const clients = ((orgs ?? []) as Row[]).map((o) => {
      const id = String(o.id);
      const acts = byOrg(actions.data, id);
      const open = acts.filter((a) => openish(String(a.status ?? "")));
      const critical = open.filter((a) => /critical|high/i.test(String((a.data as any)?.priority ?? "")));
      const pend = byOrg(decisions.data, id).filter((d) => /review|pending/i.test(String(d.status ?? "")));
      const vs = byOrg(visits.data, id);
      const nextVisit = vs
        .map((v) => String(v.occurred_on ?? ""))
        .filter((d) => d && d >= today)
        .sort()[0] ?? null;
      const hours = byOrg(activities.data, id).reduce(
        (sum, a) => sum + (Number((a.data as any)?.hours) || 0),
        0,
      );
      const hoursThisMonth = byOrg(activities.data, id)
        .filter((a) => String(a.occurred_on ?? "") >= monthISO)
        .reduce((sum, a) => sum + (Number((a.data as any)?.hours) || 0), 0);
      const latestBrief = byOrg(briefings.data, id)
        .map((b) => String(b.occurred_on ?? ""))
        .filter(Boolean)
        .sort()
        .pop() ?? null;
      const lastActivity = [...acts, ...byOrg(activities.data, id), ...byOrg(briefings.data, id)]
        .map((r) => String(r.updated_at ?? ""))
        .filter(Boolean)
        .sort()
        .pop() ?? null;
      const project = byOrg(projects.data, id)[0] ?? null;

      return {
        ...toSummary(db, o),
        openActions: open.length,
        criticalActions: critical.length,
        pendingDecisions: pend.length,
        siteVisits: vs.length,
        nextVisit,
        latestAssessment: latestBrief,
        hours,
        hoursThisMonth,
        lastActivity,
        phase: (project?.phase as string) ?? null,
        projectStatus: (project?.status as string) ?? null,
        nextMilestone: (project?.next_action as string) ?? null,
        assessmentsThisMonth: byOrg(briefings.data, id).filter(
          (b) => String(b.occurred_on ?? "") >= monthISO,
        ).length,
      };
    });

    const active = clients.filter((c) => c.accountStatus === "Active");
    return {
      clients,
      totals: {
        activeClients: active.length,
        activeEngagements: clients.filter((c) => ["Active", "Setup"].includes(c.accountStatus)).length,
        assessmentsThisMonth: clients.reduce((s, c) => s + c.assessmentsThisMonth, 0),
        criticalActions: clients.reduce((s, c) => s + c.criticalActions, 0),
        pendingDecisions: clients.reduce((s, c) => s + c.pendingDecisions, 0),
        upcomingVisits: clients.filter((c) => c.nextVisit).length,
        hoursThisMonth: clients.reduce((s, c) => s + c.hoursThisMonth, 0),
      },
    };
  });

export const listClientAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orgId?: string } | undefined) => data ?? {})
  .handler(async ({ context, data }) => {
    const { db, orgId } = await ctx(context.userId as string, data?.orgId);
    const { data: rows } = await db
      .from("audit_log")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(200);
    const ids = ((rows ?? []) as Row[]).map((r) => r.user_id).filter(Boolean);
    const profiles = ids.length
      ? ((await db.from("profiles").select("id, full_name, email").in("id", ids)).data ?? [])
      : [];
    const byId = new Map(profiles.map((p: any) => [String(p.id), p]));
    return {
      entries: ((rows ?? []) as Row[]).map((r) => {
        const p = r.user_id ? byId.get(String(r.user_id)) : null;
        return {
          id: String(r.id),
          actor: (r.actor as string) || p?.full_name || p?.email || "System",
          action: String(r.action),
          recordType: r.record_type ?? null,
          recordLabel: r.record_label ?? null,
          previousStatus: r.previous_status ?? null,
          newStatus: r.new_status ?? null,
          createdAt: String(r.created_at),
        };
      }),
    };
  });
