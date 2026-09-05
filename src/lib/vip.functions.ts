import { createServerFn } from "@tanstack/react-start";

// VIP & Special Guests. Same security model as the consulting and document
// areas: the browser never touches these tables. Every call carries a device
// access code the server validates first, and the returned record is trimmed
// to what that device's role is allowed to see.

type Row = Record<string, any>;

const BUCKET = "documents";
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export type VipRole = "admin" | "executive" | "security" | "parking";

const STATUSES = [
  "SCHEDULED",
  "EN ROUTE",
  "ARRIVED",
  "PARKED",
  "ESCORTED / RECEIVED",
  "DEPARTING",
  "DEPARTED",
  "CANCELLED",
  "NO SHOW",
] as const;

// Which statuses each role is allowed to set.
const STATUS_RIGHTS: Record<VipRole, readonly string[]> = {
  admin: STATUSES,
  executive: STATUSES,
  security: ["EN ROUTE", "ARRIVED", "PARKED", "ESCORTED / RECEIVED", "DEPARTING", "DEPARTED", "NO SHOW"],
  parking: ["ARRIVED", "PARKED"],
};

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
    .select("code, revoked, role, label")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("Could not verify device access");
  if (!data || data.revoked) throw new Error("This device is not invited");
  void db.from("device_access_codes").update({ last_used_at: new Date().toISOString() }).eq("code", code);
  const role = (data.role ?? "admin") as VipRole;
  const actor = (data.label ?? code) as string;
  return { code, db, role, actor };
}

async function requireEditor(rawCode: unknown) {
  const ctx = await requireDevice(rawCode);
  if (ctx.role !== "admin" && ctx.role !== "executive") {
    throw new Error("This device can update guest status only");
  }
  return ctx;
}

async function log(db: any, visitId: string | null, guestName: string, action: string, actor: string, details?: string) {
  await db.from("vip_activity_log").insert({
    visit_id: visitId,
    guest_name: guestName,
    action,
    actor,
    details: details ?? null,
  });
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}
function nullable(v: unknown): string | null {
  const s = str(v);
  return s ? s : null;
}
function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "Yes";
}

/** Trim a full record down to what the given role may see. */
function shape(visit: Row, role: VipRole): Row {
  const guest = (visit.guest ?? {}) as Row;
  const vehicle = (visit.vehicle ?? {}) as Row;
  const parking = (visit.parking ?? {}) as Row;

  const minimal = role === "parking";
  const opsOnly = role === "parking" || role === "security";

  return {
    id: visit.id,
    visitDate: visit.visit_date,
    event: visit.event,
    expectedArrival: visit.expected_arrival,
    expectedDeparture: minimal ? null : visit.expected_departure,
    hostName: minimal ? null : visit.host_name,
    hostPhone: opsOnly ? null : visit.host_phone,
    partySize: visit.party_size,
    specialInstructions: visit.special_instructions,
    internalNotes: role === "admin" || role === "executive" ? visit.internal_notes : null,
    arrivalMethod: visit.arrival_method,
    status: visit.status,
    arrivedAt: visit.arrived_at,
    arrivedBy: visit.arrived_by,
    parkedAt: visit.parked_at,
    parkedBy: visit.parked_by,
    receivedAt: visit.received_at,
    receivedBy: visit.received_by,
    departingAt: visit.departing_at,
    departedAt: visit.departed_at,
    departedBy: visit.departed_by,
    departureNotes: minimal ? null : visit.departure_notes,
    guest: {
      id: guest.id,
      fullName: guest.full_name,
      guestTitle: guest.guest_title,
      organization: guest.organization,
      phone: opsOnly ? null : guest.phone,
      email: opsOnly ? null : guest.email,
      guestType: guest.guest_type,
      photoUrl: visit.photoUrl ?? null,
    },
    vehicle: {
      make: vehicle.make ?? null,
      model: vehicle.model ?? null,
      color: vehicle.color ?? null,
      plate: vehicle.plate ?? null,
      vehicleType: vehicle.vehicle_type ?? null,
      description: vehicle.description ?? null,
      driverName: vehicle.driver_name ?? null,
      driverPhone: opsOnly ? null : (vehicle.driver_phone ?? null),
      driverCompany: vehicle.driver_company ?? null,
      driverVehicle: vehicle.driver_vehicle ?? null,
      driverOnSite: vehicle.driver_on_site ?? false,
    },
    parking: {
      lot: parking.lot ?? null,
      spaceZone: parking.space_zone ?? null,
      reservedArea: parking.reserved_area ?? null,
      dropOff: parking.drop_off ?? null,
      gate: parking.gate ?? null,
      arrivalRoute: parking.arrival_route ?? null,
      exitRoute: parking.exit_route ?? null,
      linkedPlan: parking.linked_plan ?? null,
      escortRequired: parking.escort_required ?? false,
      golfCartRequired: parking.golf_cart_required ?? false,
      adaRequired: parking.ada_required ?? false,
      instructions: parking.instructions ?? null,
    },
    notes: minimal ? [] : (visit.notes ?? []),
    history: visit.history ?? [],
  };
}

export const loadVipBoard = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { db, role, actor } = await requireDevice(data?.code);

    const [visitsRes, guestsRes, vehiclesRes, parkingRes, notesRes, historyRes, activityRes] = await Promise.all([
      db.from("vip_visits").select("*").order("visit_date", { ascending: false }).order("expected_arrival"),
      db.from("vip_guests").select("*"),
      db.from("vip_vehicles").select("*"),
      db.from("vip_parking_assignments").select("*"),
      db.from("vip_notes").select("*").order("created_at", { ascending: false }),
      db.from("vip_status_history").select("*").order("created_at", { ascending: false }),
      db.from("vip_activity_log").select("*").order("created_at", { ascending: false }).limit(300),
    ]);

    const guests = new Map<string, Row>(((guestsRes?.data ?? []) as Row[]).map((g) => [g.id, g]));
    const vehicles = new Map<string, Row>(((vehiclesRes?.data ?? []) as Row[]).map((v) => [v.visit_id, v]));
    const parking = new Map<string, Row>(((parkingRes?.data ?? []) as Row[]).map((p) => [p.visit_id, p]));

    const notesBy = new Map<string, Row[]>();
    for (const n of (notesRes?.data ?? []) as Row[]) {
      const list = notesBy.get(n.visit_id) ?? [];
      list.push({ id: n.id, category: n.category, note: n.note, actor: n.actor, at: n.created_at });
      notesBy.set(n.visit_id, list);
    }
    const historyBy = new Map<string, Row[]>();
    for (const h of (historyRes?.data ?? []) as Row[]) {
      const list = historyBy.get(h.visit_id) ?? [];
      list.push({ id: h.id, status: h.status, actor: h.actor, note: h.note, at: h.created_at });
      historyBy.set(h.visit_id, list);
    }

    const out: Row[] = [];
    for (const v of (visitsRes?.data ?? []) as Row[]) {
      const guest = guests.get(v.guest_id) ?? {};
      let photoUrl: string | null = null;
      if (guest.photo_path) {
        const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(guest.photo_path, 60 * 60 * 8);
        photoUrl = signed?.signedUrl ?? null;
      }
      out.push(
        shape(
          {
            ...v,
            guest,
            vehicle: vehicles.get(v.id) ?? {},
            parking: parking.get(v.id) ?? {},
            notes: notesBy.get(v.id) ?? [],
            history: historyBy.get(v.id) ?? [],
            photoUrl,
          },
          role,
        ),
      );
    }

    const activity =
      role === "admin" || role === "executive"
        ? ((activityRes?.data ?? []) as Row[]).map((a) => ({
            id: a.id,
            visitId: a.visit_id,
            guestName: a.guest_name,
            action: a.action,
            actor: a.actor,
            details: a.details,
            at: a.created_at,
          }))
        : [];

    return { role, actor, visits: out, activity, statuses: STATUSES, allowedStatuses: STATUS_RIGHTS[role] };
  });

export const saveVipVisit = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { code: string; id?: string | null; guestId?: string | null; guest: Row; visit: Row; vehicle: Row; parking: Row }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { db, actor } = await requireEditor(data?.code);
    const g = data?.guest ?? {};
    const v = data?.visit ?? {};
    const veh = data?.vehicle ?? {};
    const pk = data?.parking ?? {};

    const guestPatch: Row = {
      full_name: str(g.fullName) || "Unnamed guest",
      guest_title: nullable(g.guestTitle),
      organization: nullable(g.organization),
      phone: nullable(g.phone),
      email: nullable(g.email),
      guest_type: str(g.guestType) || "VIP",
    };

    let guestId = data?.guestId ?? null;
    if (guestId) {
      const { error } = await db.from("vip_guests").update(guestPatch).eq("id", guestId);
      if (error) throw new Error("Could not save the guest");
    } else {
      const { data: row, error } = await db.from("vip_guests").insert(guestPatch).select("id").single();
      if (error) throw new Error("Could not save the guest");
      guestId = row.id as string;
    }

    const visitPatch: Row = {
      guest_id: guestId,
      visit_date: str(v.visitDate) || new Date().toISOString().slice(0, 10),
      event: nullable(v.event),
      expected_arrival: nullable(v.expectedArrival),
      expected_departure: nullable(v.expectedDeparture),
      host_name: nullable(v.hostName),
      host_phone: nullable(v.hostPhone),
      party_size: Math.max(1, Math.floor(Number(v.partySize) || 1)),
      special_instructions: nullable(v.specialInstructions),
      internal_notes: nullable(v.internalNotes),
      arrival_method: str(v.arrivalMethod) || "Self-Driving",
    };
    if (!data?.id) visitPatch.status = "SCHEDULED";

    let visitId = data?.id ?? null;
    if (visitId) {
      const { error } = await db.from("vip_visits").update(visitPatch).eq("id", visitId);
      if (error) throw new Error("Could not save the visit");
    } else {
      const { data: row, error } = await db.from("vip_visits").insert(visitPatch).select("id").single();
      if (error) throw new Error("Could not save the visit");
      visitId = row.id as string;
    }

    const vehiclePatch: Row = {
      visit_id: visitId,
      make: nullable(veh.make),
      model: nullable(veh.model),
      color: nullable(veh.color),
      plate: nullable(veh.plate) ? String(veh.plate).trim().toUpperCase() : null,
      vehicle_type: nullable(veh.vehicleType),
      description: nullable(veh.description),
      driver_name: nullable(veh.driverName),
      driver_phone: nullable(veh.driverPhone),
      driver_company: nullable(veh.driverCompany),
      driver_vehicle: nullable(veh.driverVehicle),
      driver_on_site: bool(veh.driverOnSite),
    };
    await db.from("vip_vehicles").upsert(vehiclePatch, { onConflict: "visit_id" });

    const parkingPatch: Row = {
      visit_id: visitId,
      lot: nullable(pk.lot),
      space_zone: nullable(pk.spaceZone),
      reserved_area: nullable(pk.reservedArea),
      drop_off: nullable(pk.dropOff),
      gate: nullable(pk.gate),
      arrival_route: nullable(pk.arrivalRoute),
      exit_route: nullable(pk.exitRoute),
      linked_plan: nullable(pk.linkedPlan),
      escort_required: bool(pk.escortRequired),
      golf_cart_required: bool(pk.golfCartRequired),
      ada_required: bool(pk.adaRequired),
      instructions: nullable(pk.instructions),
    };
    await db.from("vip_parking_assignments").upsert(parkingPatch, { onConflict: "visit_id" });

    await log(
      db,
      visitId,
      guestPatch.full_name,
      data?.id ? "Guest record updated" : "Guest record created",
      actor,
      data?.id ? undefined : `Expected ${visitPatch.visit_date} ${visitPatch.expected_arrival ?? ""}`.trim(),
    );

    return { id: visitId, guestId };
  });

export const setVipStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id: string; status: string; note?: string }) => data)
  .handler(async ({ data }) => {
    const { db, role, actor } = await requireDevice(data?.code);
    const status = str(data?.status).toUpperCase() === "ESCORTED / RECEIVED" ? "ESCORTED / RECEIVED" : str(data?.status);
    if (!(STATUSES as readonly string[]).includes(status)) throw new Error("Unknown status");
    if (!STATUS_RIGHTS[role].includes(status)) throw new Error("This device cannot set that status");

    const { data: visit, error: vErr } = await db
      .from("vip_visits")
      .select("id, guest_id, status")
      .eq("id", data?.id)
      .maybeSingle();
    if (vErr || !visit) throw new Error("Could not find that guest visit");
    const { data: guest } = await db.from("vip_guests").select("full_name").eq("id", visit.guest_id).maybeSingle();
    const guestName = guest?.full_name ?? "Guest";

    const now = new Date().toISOString();
    const patch: Row = { status };
    if (status === "ARRIVED") {
      patch.arrived_at = now;
      patch.arrived_by = actor;
    } else if (status === "PARKED") {
      patch.parked_at = now;
      patch.parked_by = actor;
    } else if (status === "ESCORTED / RECEIVED") {
      patch.received_at = now;
      patch.received_by = actor;
    } else if (status === "DEPARTING") {
      patch.departing_at = now;
      patch.departing_by = actor;
    } else if (status === "DEPARTED") {
      patch.departed_at = now;
      patch.departed_by = actor;
    }
    if (str(data?.note)) patch.departure_notes = str(data?.note);

    const { error } = await db.from("vip_visits").update(patch).eq("id", data?.id);
    if (error) throw new Error("Could not update that guest");

    await db.from("vip_status_history").insert({
      visit_id: data?.id,
      status,
      actor,
      note: nullable(data?.note),
    });
    await log(db, data?.id ?? null, guestName, `Guest marked ${status}`, actor, nullable(data?.note) ?? undefined);

    return { ok: true as const, status, at: now, actor };
  });

export const addVipNote = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id: string; category?: string; note: string }) => data)
  .handler(async ({ data }) => {
    const { db, actor } = await requireDevice(data?.code);
    const note = str(data?.note);
    if (!note) throw new Error("Write the note first");
    const { data: visit } = await db.from("vip_visits").select("guest_id").eq("id", data?.id).maybeSingle();
    const { data: guest } = visit
      ? await db.from("vip_guests").select("full_name").eq("id", visit.guest_id).maybeSingle()
      : { data: null as Row | null };

    const { error } = await db.from("vip_notes").insert({
      visit_id: data?.id,
      category: nullable(data?.category),
      note,
      actor,
    });
    if (error) throw new Error("Could not save that note");
    await log(db, data?.id ?? null, guest?.full_name ?? "Guest", "Note added", actor, note.slice(0, 180));
    return { ok: true as const };
  });

export const uploadVipPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; guestId: string; contentType: string; base64: string }) => data)
  .handler(async ({ data }) => {
    const { db, actor } = await requireEditor(data?.code);
    const type = str(data?.contentType) || "image/jpeg";
    if (!type.startsWith("image/")) throw new Error("Please choose an image file");
    const base64 = str(data?.base64);
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_PHOTO_BYTES) throw new Error("That photo is larger than 6 MB");

    const ext = type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `vip/${data?.guestId}-${Date.now()}.${ext}`;
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: type });
    if (upErr) throw new Error("Could not upload that photo");

    const { data: prev } = await db.from("vip_guests").select("photo_path, full_name").eq("id", data?.guestId).maybeSingle();
    const { error } = await db.from("vip_guests").update({ photo_path: path }).eq("id", data?.guestId);
    if (error) throw new Error("Could not attach that photo");
    if (prev?.photo_path) await db.storage.from(BUCKET).remove([prev.photo_path]);
    await log(db, null, prev?.full_name ?? "Guest", "Guest photo updated", actor);

    const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 8);
    return { photoUrl: signed?.signedUrl ?? "" };
  });

export const deleteVipVisit = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; id: string }) => data)
  .handler(async ({ data }) => {
    const { db, role, actor } = await requireDevice(data?.code);
    if (role !== "admin") throw new Error("Only an admin device can delete a guest record");
    const { data: visit } = await db.from("vip_visits").select("guest_id").eq("id", data?.id).maybeSingle();
    const { data: guest } = visit
      ? await db.from("vip_guests").select("full_name").eq("id", visit.guest_id).maybeSingle()
      : { data: null as Row | null };
    const { error } = await db.from("vip_visits").delete().eq("id", data?.id);
    if (error) throw new Error("Could not delete that guest record");
    await log(db, null, guest?.full_name ?? "Guest", "Guest record deleted", actor);
    return { ok: true as const };
  });
