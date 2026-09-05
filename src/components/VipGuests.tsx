import { useEffect, useMemo, useState } from "react";
import CodeGate from "@/components/CodeGate";
import { getDeviceCode, setDeviceCode } from "@/lib/device-access";
import { useParkingState } from "@/lib/parking-lots";
import {
  loadVipBoard,
  saveVipVisit,
  setVipStatus,
  addVipNote,
  uploadVipPhoto,
  deleteVipVisit,
} from "@/lib/vip.functions";

/* ------------------------------------------------------------------ types */

type Role = "admin" | "executive" | "security" | "parking";

type Visit = {
  id: string;
  visitDate: string;
  event: string | null;
  expectedArrival: string | null;
  expectedDeparture: string | null;
  hostName: string | null;
  hostPhone: string | null;
  partySize: number;
  specialInstructions: string | null;
  internalNotes: string | null;
  arrivalMethod: string;
  status: string;
  arrivedAt: string | null;
  arrivedBy: string | null;
  parkedAt: string | null;
  receivedAt: string | null;
  departingAt: string | null;
  departedAt: string | null;
  departureNotes: string | null;
  guest: {
    id: string;
    fullName: string;
    guestTitle: string | null;
    organization: string | null;
    phone: string | null;
    email: string | null;
    guestType: string;
    photoUrl: string | null;
  };
  vehicle: Record<string, any>;
  parking: Record<string, any>;
  notes: { id: string; category: string | null; note: string; actor: string | null; at: string }[];
  history: { id: string; status: string; actor: string | null; note: string | null; at: string }[];
};

type Activity = {
  id: string;
  guestName: string | null;
  action: string;
  actor: string | null;
  details: string | null;
  at: string;
};

const GUEST_TYPES = [
  "VIP",
  "Special Guest",
  "Speaker",
  "Pastor / Clergy",
  "Government Official",
  "Celebrity / Public Figure",
  "Vendor",
  "Executive",
  "Other",
];

const ARRIVAL_METHODS = ["Self-Driving", "Chauffeur / Driver", "Church Transportation", "Rideshare", "Other"];
const VEHICLE_TYPES = ["Sedan", "SUV", "Van", "Limousine", "Bus", "Other"];

const NOTE_CATEGORIES = [
  "Vehicle changed",
  "Guest arriving early",
  "Guest running late",
  "Driver changed",
  "Parking assignment changed",
  "Guest requires assistance",
  "Host contacted",
  "Alternate gate",
  "Departure route changed",
  "Other",
];

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "bg-white/10 text-slate-200 border-white/15",
  "EN ROUTE": "bg-kairos-blue/20 text-kairos-blue border-kairos-blue/40",
  ARRIVED: "bg-green-500/20 text-green-300 border-green-500/50",
  PARKED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  "ESCORTED / RECEIVED": "bg-kairos-gold/20 text-kairos-gold border-kairos-gold/50",
  DEPARTING: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  DEPARTED: "bg-slate-500/20 text-slate-400 border-white/10",
  CANCELLED: "bg-red-500/15 text-red-300 border-red-500/40",
  "NO SHOW": "bg-red-500/15 text-red-300 border-red-500/40",
};

const card = "bg-surface border border-white/5 rounded-2xl p-4 lg:p-5";
const field =
  "w-full h-10 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1";

const todayKey = () => new Date().toISOString().slice(0, 10);

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function vehicleLine(v: Record<string, any>) {
  const parts = [v.color, v.make, v.model, v.vehicleType].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}
function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Could not read that file"));
    r.readAsDataURL(file);
  });
}

function emptyDraft() {
  return {
    id: null as string | null,
    guestId: null as string | null,
    guest: {
      fullName: "",
      guestTitle: "",
      organization: "",
      phone: "",
      email: "",
      guestType: "VIP",
    },
    visit: {
      visitDate: todayKey(),
      event: "",
      expectedArrival: "",
      expectedDeparture: "",
      hostName: "",
      hostPhone: "",
      partySize: 1,
      specialInstructions: "",
      internalNotes: "",
      arrivalMethod: "Self-Driving",
    },
    vehicle: {
      make: "",
      model: "",
      color: "",
      plate: "",
      vehicleType: "Sedan",
      description: "",
      driverName: "",
      driverPhone: "",
      driverCompany: "",
      driverVehicle: "",
      driverOnSite: false,
    },
    parking: {
      lot: "",
      spaceZone: "",
      reservedArea: "",
      dropOff: "",
      gate: "",
      arrivalRoute: "",
      exitRoute: "",
      linkedPlan: "",
      escortRequired: false,
      golfCartRequired: false,
      adaRequired: false,
      instructions: "",
    },
  };
}
type Draft = ReturnType<typeof emptyDraft>;

function draftFrom(v: Visit): Draft {
  const d = emptyDraft();
  d.id = v.id;
  d.guestId = v.guest.id;
  d.guest = {
    fullName: v.guest.fullName ?? "",
    guestTitle: v.guest.guestTitle ?? "",
    organization: v.guest.organization ?? "",
    phone: v.guest.phone ?? "",
    email: v.guest.email ?? "",
    guestType: v.guest.guestType ?? "VIP",
  };
  d.visit = {
    visitDate: v.visitDate ?? todayKey(),
    event: v.event ?? "",
    expectedArrival: v.expectedArrival ?? "",
    expectedDeparture: v.expectedDeparture ?? "",
    hostName: v.hostName ?? "",
    hostPhone: v.hostPhone ?? "",
    partySize: v.partySize ?? 1,
    specialInstructions: v.specialInstructions ?? "",
    internalNotes: v.internalNotes ?? "",
    arrivalMethod: v.arrivalMethod ?? "Self-Driving",
  };
  for (const k of Object.keys(d.vehicle)) (d.vehicle as any)[k] = (v.vehicle as any)[k] ?? (typeof (d.vehicle as any)[k] === "boolean" ? false : "");
  for (const k of Object.keys(d.parking)) (d.parking as any)[k] = (v.parking as any)[k] ?? (typeof (d.parking as any)[k] === "boolean" ? false : "");
  return d;
}

/* ------------------------------------------------------------- component */

type Tab = "TODAY" | "COMMAND" | "UPCOMING" | "HISTORY" | "LOG";

export function VipGuests() {
  const [code, setCode] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("parking");
  const [allowed, setAllowed] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>("TODAY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [parkingState] = useParkingState();

  const canEdit = role === "admin" || role === "executive";

  const refresh = async (c: string) => {
    try {
      const res: any = await loadVipBoard({ data: { code: c } });
      setRole((res?.role ?? "parking") as Role);
      setAllowed((res?.allowedStatuses ?? []) as string[]);
      setVisits((res?.visits ?? []) as Visit[]);
      setActivity((res?.activity ?? []) as Activity[]);
      setError(null);
    } catch (e: any) {
      if (String(e?.message ?? "").includes("not invited")) {
        setDeviceCode(null as any);
        setCode(null);
        return;
      }
      setError(e?.message ?? "Could not load VIP records");
    }
  };

  useEffect(() => {
    const saved = getDeviceCode();
    if (saved) {
      setCode(saved);
      void refresh(saved);
    }
  }, []);

  const today = todayKey();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visits.filter((v) => {
      if (typeFilter && v.guest.guestType !== typeFilter) return false;
      if (statusFilter && v.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        v.guest.fullName,
        v.guest.organization,
        v.event,
        v.hostName,
        v.status,
        v.parking?.lot,
        v.parking?.gate,
        v.vehicle?.plate,
        v.visitDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [visits, query, typeFilter, statusFilter]);

  const todays = filtered.filter((v) => v.visitDate === today);
  const upcoming = filtered.filter((v) => v.visitDate > today);
  const history = filtered.filter((v) => v.visitDate < today || v.status === "DEPARTED" || v.status === "CANCELLED" || v.status === "NO SHOW");

  const summary = useMemo(() => {
    const t = visits.filter((v) => v.visitDate === today);
    const onCampus = t.filter((v) => ["ARRIVED", "PARKED", "ESCORTED / RECEIVED", "DEPARTING"].includes(v.status));
    return {
      expected: t.length,
      arrived: t.filter((v) => v.arrivedAt).length,
      onCampus: onCampus.length,
      departed: t.filter((v) => v.status === "DEPARTED").length,
      upcoming: visits.filter((v) => v.visitDate > today).length,
    };
  }, [visits, today]);

  const act = async (id: string, status: string, note?: string) => {
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      await setVipStatus({ data: { code, id, status, note } });
      await refresh(code);
    } catch (e: any) {
      setError(e?.message ?? "Could not update that guest");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!code || !draft) return;
    setBusy(true);
    setError(null);
    try {
      await saveVipVisit({
        data: {
          code,
          id: draft.id,
          guestId: draft.guestId,
          guest: draft.guest,
          visit: draft.visit,
          vehicle: draft.vehicle,
          parking: draft.parking,
        },
      });
      setDraft(null);
      await refresh(code);
    } catch (e: any) {
      setError(e?.message ?? "Could not save that guest");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!code) return;
    setBusy(true);
    try {
      await deleteVipVisit({ data: { code, id } });
      setOpenId(null);
      await refresh(code);
    } catch (e: any) {
      setError(e?.message ?? "Could not delete that record");
    } finally {
      setBusy(false);
    }
  };

  if (!code) {
    return (
      <div className="p-4 lg:p-6 overflow-y-auto">
        <div className={`${card} max-w-xl`}>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-1">VIP &amp; Special Guests</h2>
          <p className="text-xs text-slate-400 mb-4">
            Guest details are restricted. Enter your access code — admin and executive codes can register guests,
            security and parking codes can update arrivals.
          </p>
          <CodeGate
            onUnlock={async (c) => {
              setCode(c);
              await refresh(c);
            }}
          />
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "TODAY", label: "Today" },
    { key: "COMMAND", label: "Command View" },
    { key: "UPCOMING", label: "Upcoming" },
    { key: "HISTORY", label: "History" },
    ...(canEdit ? [{ key: "LOG" as Tab, label: "Activity Log" }] : []),
  ];

  const open = visits.find((v) => v.id === openId) ?? null;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">VIP &amp; Special Guests</h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider">
            Signed in as {role} device
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setDraft(emptyDraft())}
            className="h-11 px-5 rounded-xl bg-kairos-gold text-bg-deep text-xs font-bold uppercase tracking-wider"
          >
            + Add Guest
          </button>
        )}
      </div>

      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { k: "Expected Today", v: summary.expected },
          { k: "Arrived", v: summary.arrived },
          { k: "On Campus", v: summary.onCampus },
          { k: "Departed", v: summary.departed },
          { k: "Upcoming", v: summary.upcoming },
        ].map((s) => (
          <div key={s.k} className={card}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.k}</p>
            <p className="text-2xl font-bold text-white tabular-nums mt-1">{s.v}</p>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition ${
              tab === t.key
                ? "bg-kairos-blue border-kairos-blue text-white"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* filters */}
      {tab !== "LOG" && (
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, event, host, plate, lot, date…"
            className={`${field} sm:w-80`}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${field} sm:w-48`}>
            <option value="">All guest types</option>
            {GUEST_TYPES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${field} sm:w-48`}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLE).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "LOG" ? (
        <div className={card}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-3">VIP Activity / Audit Log</h3>
          {activity.length === 0 ? (
            <p className="text-xs text-slate-500">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="text-xs text-slate-300 border-b border-white/5 pb-2">
                  <span className="font-mono text-slate-500">{fmtDateTime(a.at)}</span> — {a.action}
                  {a.guestName ? <span className="text-white"> · {a.guestName}</span> : null}
                  {a.actor ? <span className="text-slate-500"> · by {a.actor}</span> : null}
                  {a.details ? <div className="text-slate-500 mt-0.5">{a.details}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={tab === "COMMAND" ? "grid gap-3 lg:grid-cols-2" : "space-y-3"}>
          {(tab === "TODAY" || tab === "COMMAND" ? todays : tab === "UPCOMING" ? upcoming : history).map((v) => (
            <GuestCard
              key={v.id}
              visit={v}
              command={tab === "COMMAND"}
              allowed={allowed}
              busy={busy}
              onStatus={(s) => act(v.id, s)}
              onOpen={() => setOpenId(v.id)}
            />
          ))}
          {(tab === "TODAY" || tab === "COMMAND" ? todays : tab === "UPCOMING" ? upcoming : history).length === 0 && (
            <div className={`${card} text-xs text-slate-500`}>No guests in this view.</div>
          )}
        </div>
      )}

      {open && (
        <DetailModal
          visit={open}
          role={role}
          allowed={allowed}
          busy={busy}
          onClose={() => setOpenId(null)}
          onStatus={(s, note) => act(open.id, s, note)}
          onEdit={() => {
            setDraft(draftFrom(open));
            setOpenId(null);
          }}
          onDelete={() => remove(open.id)}
          onNote={async (category, note) => {
            if (!code) return;
            setBusy(true);
            try {
              await addVipNote({ data: { code, id: open.id, category, note } });
              await refresh(code);
            } catch (e: any) {
              setError(e?.message ?? "Could not add that note");
            } finally {
              setBusy(false);
            }
          }}
          onPhoto={async (file) => {
            if (!code) return;
            setBusy(true);
            try {
              const base64 = await fileToBase64(file);
              await uploadVipPhoto({
                data: { code, guestId: open.guest.id, contentType: file.type || "image/jpeg", base64 },
              });
              await refresh(code);
            } catch (e: any) {
              setError(e?.message ?? "Could not upload that photo");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {draft && (
        <GuestForm
          draft={draft}
          setDraft={setDraft}
          lots={parkingState.lots.map((l: any) => l.name)}
          busy={busy}
          onCancel={() => setDraft(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- cards */

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
        STATUS_STYLE[status] ?? STATUS_STYLE.SCHEDULED
      }`}
    >
      {status}
    </span>
  );
}

function ActionButtons({
  visit,
  allowed,
  busy,
  onStatus,
  big,
}: {
  visit: Visit;
  allowed: string[];
  busy: boolean;
  onStatus: (s: string) => void;
  big?: boolean;
}) {
  const steps: { status: string; label: string; tone: string }[] = [
    { status: "ARRIVED", label: "Guest Arrived", tone: "bg-green-500 text-bg-deep" },
    { status: "PARKED", label: "Parked", tone: "bg-emerald-600 text-white" },
    { status: "ESCORTED / RECEIVED", label: "Received", tone: "bg-kairos-gold text-bg-deep" },
    { status: "DEPARTING", label: "Begin Departure", tone: "bg-orange-500 text-bg-deep" },
    { status: "DEPARTED", label: "Guest Departed", tone: "bg-slate-600 text-white" },
  ];
  const usable = steps.filter((s) => allowed.includes(s.status));
  if (usable.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {usable.map((s) => {
        const done = visit.status === s.status;
        return (
          <button
            key={s.status}
            type="button"
            disabled={busy || done}
            onClick={() => onStatus(s.status)}
            className={`${big ? "h-14 px-5 text-sm" : "h-11 px-4 text-xs"} rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 ${s.tone}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function GuestCard({
  visit,
  command,
  allowed,
  busy,
  onStatus,
  onOpen,
}: {
  visit: Visit;
  command?: boolean;
  allowed: string[];
  busy: boolean;
  onStatus: (s: string) => void;
  onOpen: () => void;
}) {
  const arrived = Boolean(visit.arrivedAt);
  return (
    <div
      className={`${card} ${arrived ? "ring-1 ring-green-500/40 border-green-500/20" : ""} space-y-3`}
    >
      <div className="flex items-start gap-3">
        {visit.guest.photoUrl ? (
          <img
            src={visit.guest.photoUrl}
            alt={`${visit.guest.fullName}`}
            className="size-14 rounded-xl object-cover border border-white/10 shrink-0"
          />
        ) : (
          <div className="size-14 rounded-xl bg-surface-bright border border-white/10 grid place-items-center text-xs font-bold text-slate-400 shrink-0">
            {visit.guest.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="text-left">
            <p className="text-base font-semibold text-white leading-tight truncate">{visit.guest.fullName}</p>
          </button>
          <p className="text-[11px] text-slate-400 truncate">
            {[visit.guest.guestType, visit.guest.guestTitle, visit.guest.organization].filter(Boolean).join(" · ")}
          </p>
        </div>
        <StatusPill status={visit.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        <Info label="Expected" value={`${visit.expectedArrival || "—"}${visit.event ? ` · ${visit.event}` : ""}`} />
        <Info label="Vehicle" value={vehicleLine(visit.vehicle)} />
        <Info label="Plate" value={visit.vehicle?.plate || "—"} mono />
        <Info label="Parking" value={[visit.parking?.lot, visit.parking?.spaceZone].filter(Boolean).join(" · ") || "—"} />
        <Info label="Gate" value={visit.parking?.gate || "—"} />
        {command ? (
          <Info label="Arrival Route" value={visit.parking?.arrivalRoute || "—"} />
        ) : (
          <Info label="Host" value={visit.hostName || "—"} />
        )}
      </div>

      {visit.specialInstructions && (
        <p className="text-[11px] text-kairos-gold/90 bg-kairos-gold/10 border border-kairos-gold/20 rounded-lg px-3 py-2">
          {visit.specialInstructions}
        </p>
      )}

      {(visit.parking?.escortRequired || visit.parking?.golfCartRequired || visit.parking?.adaRequired) && (
        <div className="flex flex-wrap gap-1.5">
          {visit.parking?.escortRequired && <Tag>Security escort</Tag>}
          {visit.parking?.golfCartRequired && <Tag>Golf cart</Tag>}
          {visit.parking?.adaRequired && <Tag>ADA assistance</Tag>}
        </div>
      )}

      {arrived && (
        <p className="text-[11px] text-green-300">
          Arrived {fmtTime(visit.arrivedAt)}
          {visit.arrivedBy ? ` · marked by ${visit.arrivedBy}` : ""}
        </p>
      )}

      <ActionButtons visit={visit} allowed={allowed} busy={busy} onStatus={onStatus} big={command} />

      <button type="button" onClick={onOpen} className="text-[11px] text-kairos-blue font-bold uppercase tracking-wider">
        Open record →
      </button>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-slate-200 truncate ${mono ? "font-mono tracking-wide" : ""}`}>{value}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- detail */

function DetailModal({
  visit,
  role,
  allowed,
  busy,
  onClose,
  onStatus,
  onEdit,
  onDelete,
  onNote,
  onPhoto,
}: {
  visit: Visit;
  role: Role;
  allowed: string[];
  busy: boolean;
  onClose: () => void;
  onStatus: (s: string, note?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onNote: (category: string, note: string) => void | Promise<void>;
  onPhoto: (file: File) => void | Promise<void>;
}) {
  const canEdit = role === "admin" || role === "executive";
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(NOTE_CATEGORIES[0]);
  const [departureNote, setDepartureNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-3 lg:p-8">
      <div className="mx-auto max-w-3xl bg-surface border border-white/10 rounded-2xl p-4 lg:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{visit.guest.fullName}</h3>
            <p className="text-[11px] text-slate-400">
              {[visit.guest.guestType, visit.guest.guestTitle, visit.guest.organization].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 text-xs font-bold uppercase">
            Close
          </button>
        </div>

        <StatusPill status={visit.status} />

        <ActionButtons visit={visit} allowed={allowed} busy={busy} onStatus={(s) => onStatus(s)} big />

        {allowed.includes("DEPARTED") && (
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={departureNote}
              onChange={(e) => setDepartureNote(e.target.value)}
              placeholder="Departure notes / confirmed exit route"
              className={`${field} sm:w-96`}
            />
            <button
              type="button"
              disabled={busy || !departureNote.trim()}
              onClick={() => {
                onStatus("DEPARTED", departureNote.trim());
                setDepartureNote("");
              }}
              className="h-10 px-4 rounded-lg bg-slate-600 text-white text-xs font-bold uppercase disabled:opacity-40"
            >
              Depart with note
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[11px]">
          <Info label="Visit date" value={visit.visitDate} />
          <Info label="Event / service" value={visit.event || "—"} />
          <Info label="Expected arrival" value={visit.expectedArrival || "—"} />
          <Info label="Expected departure" value={visit.expectedDeparture || "—"} />
          <Info label="Party size" value={String(visit.partySize)} />
          <Info label="Arrival method" value={visit.arrivalMethod} />
          <Info label="Host" value={visit.hostName || "—"} />
          {visit.hostPhone && <Info label="Host phone" value={visit.hostPhone} />}
          {visit.guest.phone && <Info label="Guest phone" value={visit.guest.phone} />}
          {visit.guest.email && <Info label="Guest email" value={visit.guest.email} />}
          <Info label="Vehicle" value={vehicleLine(visit.vehicle)} />
          <Info label="Plate" value={visit.vehicle?.plate || "—"} mono />
          <Info label="Vehicle notes" value={visit.vehicle?.description || "—"} />
          <Info label="Driver" value={visit.vehicle?.driverName || "—"} />
          {visit.vehicle?.driverPhone && <Info label="Driver phone" value={visit.vehicle.driverPhone} />}
          <Info label="Driver company" value={visit.vehicle?.driverCompany || "—"} />
          <Info label="Driver stays on-site" value={visit.vehicle?.driverOnSite ? "Yes" : "No"} />
          <Info label="Assigned lot" value={visit.parking?.lot || "—"} />
          <Info label="Space / zone" value={visit.parking?.spaceZone || "—"} />
          <Info label="Reserved area" value={visit.parking?.reservedArea || "—"} />
          <Info label="Drop-off" value={visit.parking?.dropOff || "—"} />
          <Info label="Entrance / gate" value={visit.parking?.gate || "—"} />
          <Info label="Arrival route" value={visit.parking?.arrivalRoute || "—"} />
          <Info label="Exit route" value={visit.parking?.exitRoute || "—"} />
          <Info label="Linked map / plan" value={visit.parking?.linkedPlan || "—"} />
        </div>

        {visit.parking?.instructions && (
          <p className="text-[11px] text-slate-300 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            Parking instructions: {visit.parking.instructions}
          </p>
        )}
        {visit.internalNotes && (
          <p className="text-[11px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            Internal notes: {visit.internalNotes}
          </p>
        )}

        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-200 grid place-items-center cursor-pointer">
              {visit.guest.photoUrl ? "Replace photo" : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onPhoto(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={onEdit}
              className="h-10 px-4 rounded-lg bg-kairos-blue text-white text-xs font-bold uppercase tracking-wider"
            >
              Edit record
            </button>
            {role === "admin" && (
              <button
                type="button"
                onClick={onDelete}
                className="h-10 px-4 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider"
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* notes */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Operational notes</h4>
          <div className="flex flex-wrap gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} sm:w-56`}>
              {NOTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              className={`${field} sm:w-72`}
            />
            <button
              type="button"
              disabled={busy || !note.trim()}
              onClick={async () => {
                await onNote(category, note.trim());
                setNote("");
              }}
              className="h-10 px-4 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold uppercase disabled:opacity-40"
            >
              Add note
            </button>
          </div>
          <ul className="space-y-1.5">
            {visit.notes.map((n) => (
              <li key={n.id} className="text-[11px] text-slate-300">
                <span className="font-mono text-slate-500">{fmtDateTime(n.at)}</span>
                {n.category ? <span className="text-kairos-gold"> · {n.category}</span> : null} — {n.note}
                {n.actor ? <span className="text-slate-500"> ({n.actor})</span> : null}
              </li>
            ))}
            {visit.notes.length === 0 && <li className="text-[11px] text-slate-500">No notes yet.</li>}
          </ul>
        </div>

        {/* status history */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Visit history</h4>
          <ul className="space-y-1.5">
            {visit.history.map((h) => (
              <li key={h.id} className="text-[11px] text-slate-300">
                <span className="font-mono text-slate-500">{fmtDateTime(h.at)}</span> — {h.status}
                {h.actor ? <span className="text-slate-500"> · {h.actor}</span> : null}
                {h.note ? <span className="text-slate-400"> · {h.note}</span> : null}
              </li>
            ))}
            {visit.history.length === 0 && <li className="text-[11px] text-slate-500">No status changes yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- form */

function GuestForm({
  draft,
  setDraft,
  lots,
  busy,
  onCancel,
  onSave,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  lots: string[];
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = (section: keyof Draft, key: string, value: any) =>
    setDraft({ ...draft, [section]: { ...(draft[section] as any), [key]: value } } as Draft);

  const driving = draft.visit.arrivalMethod === "Self-Driving" || draft.visit.arrivalMethod === "Chauffeur / Driver";
  const chauffeur = draft.visit.arrivalMethod === "Chauffeur / Driver";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-3 lg:p-8">
      <div className="mx-auto max-w-3xl bg-surface border border-white/10 rounded-2xl p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{draft.id ? "Edit guest visit" : "Add guest"}</h3>
          <button type="button" onClick={onCancel} className="text-slate-400 text-xs font-bold uppercase">
            Cancel
          </button>
        </div>

        <Section title="Guest information">
          <F label="Full name">
            <input className={field} value={draft.guest.fullName} onChange={(e) => set("guest", "fullName", e.target.value)} />
          </F>
          <F label="Title">
            <input className={field} value={draft.guest.guestTitle} onChange={(e) => set("guest", "guestTitle", e.target.value)} />
          </F>
          <F label="Organization / church / company">
            <input className={field} value={draft.guest.organization} onChange={(e) => set("guest", "organization", e.target.value)} />
          </F>
          <F label="Mobile phone">
            <input className={field} value={draft.guest.phone} onChange={(e) => set("guest", "phone", e.target.value)} />
          </F>
          <F label="Email (optional)">
            <input className={field} value={draft.guest.email} onChange={(e) => set("guest", "email", e.target.value)} />
          </F>
          <F label="Guest type">
            <select className={field} value={draft.guest.guestType} onChange={(e) => set("guest", "guestType", e.target.value)}>
              {GUEST_TYPES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </F>
        </Section>

        <Section title="Event / visit information">
          <F label="Date of visit">
            <input type="date" className={field} value={draft.visit.visitDate} onChange={(e) => set("visit", "visitDate", e.target.value)} />
          </F>
          <F label="Event / service">
            <input className={field} value={draft.visit.event} onChange={(e) => set("visit", "event", e.target.value)} placeholder="10:00 AM Service" />
          </F>
          <F label="Expected arrival">
            <input className={field} value={draft.visit.expectedArrival} onChange={(e) => set("visit", "expectedArrival", e.target.value)} placeholder="9:30 AM" />
          </F>
          <F label="Expected departure">
            <input className={field} value={draft.visit.expectedDeparture} onChange={(e) => set("visit", "expectedDeparture", e.target.value)} placeholder="12:15 PM" />
          </F>
          <F label="Host / church contact">
            <input className={field} value={draft.visit.hostName} onChange={(e) => set("visit", "hostName", e.target.value)} />
          </F>
          <F label="Host phone">
            <input className={field} value={draft.visit.hostPhone} onChange={(e) => set("visit", "hostPhone", e.target.value)} />
          </F>
          <F label="People in party">
            <input
              type="number"
              min={1}
              className={field}
              value={draft.visit.partySize}
              onChange={(e) => set("visit", "partySize", Number(e.target.value))}
            />
          </F>
          <F label="Arrival method">
            <select className={field} value={draft.visit.arrivalMethod} onChange={(e) => set("visit", "arrivalMethod", e.target.value)}>
              {ARRIVAL_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </F>
          <F label="Special instructions" wide>
            <textarea
              rows={2}
              className={`${field} h-auto py-2`}
              value={draft.visit.specialInstructions}
              onChange={(e) => set("visit", "specialInstructions", e.target.value)}
            />
          </F>
          <F label="Internal notes" wide>
            <textarea
              rows={2}
              className={`${field} h-auto py-2`}
              value={draft.visit.internalNotes}
              onChange={(e) => set("visit", "internalNotes", e.target.value)}
            />
          </F>
        </Section>

        {driving && (
          <Section title="Vehicle information">
            <F label="Make">
              <input className={field} value={draft.vehicle.make} onChange={(e) => set("vehicle", "make", e.target.value)} />
            </F>
            <F label="Model">
              <input className={field} value={draft.vehicle.model} onChange={(e) => set("vehicle", "model", e.target.value)} />
            </F>
            <F label="Color">
              <input className={field} value={draft.vehicle.color} onChange={(e) => set("vehicle", "color", e.target.value)} />
            </F>
            <F label="License plate">
              <input className={`${field} font-mono uppercase`} value={draft.vehicle.plate} onChange={(e) => set("vehicle", "plate", e.target.value.toUpperCase())} />
            </F>
            <F label="Vehicle type">
              <select className={field} value={draft.vehicle.vehicleType} onChange={(e) => set("vehicle", "vehicleType", e.target.value)}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </F>
            <F label="Additional vehicle description" wide>
              <input className={field} value={draft.vehicle.description} onChange={(e) => set("vehicle", "description", e.target.value)} />
            </F>
          </Section>
        )}

        {chauffeur && (
          <Section title="Driver information">
            <F label="Driver name">
              <input className={field} value={draft.vehicle.driverName} onChange={(e) => set("vehicle", "driverName", e.target.value)} />
            </F>
            <F label="Driver phone">
              <input className={field} value={draft.vehicle.driverPhone} onChange={(e) => set("vehicle", "driverPhone", e.target.value)} />
            </F>
            <F label="Driver company">
              <input className={field} value={draft.vehicle.driverCompany} onChange={(e) => set("vehicle", "driverCompany", e.target.value)} />
            </F>
            <F label="Driver vehicle information">
              <input className={field} value={draft.vehicle.driverVehicle} onChange={(e) => set("vehicle", "driverVehicle", e.target.value)} />
            </F>
            <Check
              label="Driver remains on-site"
              checked={draft.vehicle.driverOnSite}
              onChange={(c) => set("vehicle", "driverOnSite", c)}
            />
          </Section>
        )}

        <Section title="Parking / arrival assignment">
          <F label="Assigned parking lot">
            <select className={field} value={draft.parking.lot} onChange={(e) => set("parking", "lot", e.target.value)}>
              <option value="">Not assigned</option>
              {lots.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </F>
          <F label="Space / zone">
            <input className={field} value={draft.parking.spaceZone} onChange={(e) => set("parking", "spaceZone", e.target.value)} />
          </F>
          <F label="Reserved parking area">
            <input className={field} value={draft.parking.reservedArea} onChange={(e) => set("parking", "reservedArea", e.target.value)} />
          </F>
          <F label="Drop-off location">
            <input className={field} value={draft.parking.dropOff} onChange={(e) => set("parking", "dropOff", e.target.value)} />
          </F>
          <F label="Entrance / gate">
            <input className={field} value={draft.parking.gate} onChange={(e) => set("parking", "gate", e.target.value)} />
          </F>
          <F label="Recommended arrival route">
            <input className={field} value={draft.parking.arrivalRoute} onChange={(e) => set("parking", "arrivalRoute", e.target.value)} />
          </F>
          <F label="Exit route">
            <input className={field} value={draft.parking.exitRoute} onChange={(e) => set("parking", "exitRoute", e.target.value)} />
          </F>
          <F label="Linked map / traffic plan">
            <input
              className={field}
              value={draft.parking.linkedPlan}
              onChange={(e) => set("parking", "linkedPlan", e.target.value)}
              placeholder="Name of a saved plan in Maps"
            />
          </F>
          <Check label="Security escort required" checked={draft.parking.escortRequired} onChange={(c) => set("parking", "escortRequired", c)} />
          <Check label="Golf cart assistance required" checked={draft.parking.golfCartRequired} onChange={(c) => set("parking", "golfCartRequired", c)} />
          <Check label="ADA assistance required" checked={draft.parking.adaRequired} onChange={(c) => set("parking", "adaRequired", c)} />
          <F label="Special parking instructions" wide>
            <textarea
              rows={2}
              className={`${field} h-auto py-2`}
              value={draft.parking.instructions}
              onChange={(e) => set("parking", "instructions", e.target.value)}
            />
          </F>
        </Section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !draft.guest.fullName.trim()}
            onClick={onSave}
            className="h-12 px-6 rounded-xl bg-kairos-gold text-bg-deep text-xs font-bold uppercase tracking-wider disabled:opacity-40"
          >
            {busy ? "Saving…" : draft.id ? "Save changes" : "Save guest"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-kairos-blue">{title}</h4>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-300 h-10">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-kairos-blue" />
      {label}
    </label>
  );
}

export default VipGuests;
