import { useEffect, useState } from "react";
import { pushSharedState } from "./shared-state";
import { loadSharedState } from "./shared-state.functions";
import { supabase } from "@/integrations/supabase/client";

// Cloud sync runs through server functions now, so it works without
// browser-side backend credentials.
const CLOUD_SYNC_ENABLED = true;

const STORAGE_KEY = "kairos.parkingLots.v1";
const EVENT = "kairos:parking-lots-changed";
const CLOUD_KEY = "parking_lots";

export type ParkingLot = {
  id: string;
  name: string;
  color: string;
  spaces: number;
  /** e.g. "Verified / High Confidence" or "Working Capacity – Pending Final Field Verification" */
  verification?: string;
  /** operational / capacity notes for the lot */
  notes?: string;
  /** YYYY-MM-DD of the last field assessment */
  assessedOn?: string;
  /** parking plan allocation: how the lot's spaces are designated */
  plan?: LotPlan;
};

export type LotPlan = {
  /** reserved spaces (staff, guests, pastoral) */
  reserved: number;
  /** Houston PD / law enforcement staging spaces */
  hpd: number;
  /** ministry team spaces */
  ministry: number;
  /** ADA / accessible spaces */
  ada: number;
  /** who parks where / plan notes */
  notes?: string;
};

export const SERVICES = [
  { id: "s7", name: "7:00 AM Service", time: "07:00" },
  { id: "s10", name: "10:00 AM Service", time: "10:00" },
  { id: "s13", name: "1:00 PM Service", time: "13:00" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export type LotCount = {
  id: string;
  lotId: string;
  /** ISO timestamp of the observation */
  at: string;
  cars: number;
  full: boolean;
  note?: string;
  /** observed fill percentage when the field note gave a percentage, not an exact car count */
  estimatePct?: number;
  /** Which church service this count belongs to */
  serviceId?: string;
  /** Service date, YYYY-MM-DD */
  date?: string;
};

export function toDateKey(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function countDate(c: LotCount): string {
  return c.date || toDateKey(c.at);
}

export function serviceName(id?: string): string {
  return SERVICES.find((s) => s.id === (id ?? SERVICES[0].id))?.name ?? "Service";
}

export function fmtDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


export type ParkingState = {
  lots: ParkingLot[];
  counts: LotCount[];
};


/**
 * A new client starts with no lots at all: they name their own lots and enter
 * the space counts. Nothing is ever inherited from another client.
 */
export const DEFAULT_PARKING_STATE: ParkingState = { lots: [], counts: [] };

function num(n: unknown, max = 100000) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(max, v);
}

function normalize(raw: unknown): ParkingState {
  const obj = (raw ?? {}) as Partial<ParkingState>;
  const lots = Array.isArray(obj.lots)
    ? obj.lots.map((l, i) => ({
        id: String(l?.id ?? `lot-${i}`),
        name: String(l?.name ?? `Lot ${i + 1}`),
        color: String(l?.color ?? "#64748b"),
        spaces: num(l?.spaces, 20000),
        verification: l?.verification ? String(l.verification) : undefined,
        notes: l?.notes ? String(l.notes) : undefined,
        assessedOn: l?.assessedOn ? String(l.assessedOn) : undefined,
        plan: l?.plan
          ? {
              reserved: num(l.plan.reserved, 20000),
              hpd: num(l.plan.hpd, 20000),
              ministry: num(l.plan.ministry, 20000),
              ada: num(l.plan.ada, 20000),
              notes: l.plan.notes ? String(l.plan.notes) : undefined,
            }
          : undefined,
      }))
    : DEFAULT_PARKING_STATE.lots;
  const counts = Array.isArray(obj.counts)
    ? obj.counts
        .map((c, i) => ({
          id: String(c?.id ?? `count-${i}`),
          lotId: String(c?.lotId ?? ""),
          at: String(c?.at ?? new Date().toISOString()),
          cars: num(c?.cars, 20000),
          full: Boolean(c?.full),
          note: c?.note ? String(c.note) : undefined,
          estimatePct:
            c?.estimatePct === undefined || c?.estimatePct === null
              ? undefined
              : num(c.estimatePct, 100),
          serviceId: c?.serviceId ? String(c.serviceId) : undefined,
          date: c?.date ? String(c.date) : toDateKey(String(c?.at ?? "")),


        }))
        .filter((c) => c.lotId)
    : [];
  return { lots, counts };
}

// Each client's board is cached separately in the browser, so switching client
// never shows the previous client's lots or counts.
let activeClientId: string | null = null;

function cacheKey(): string {
  return activeClientId ? `${STORAGE_KEY}:${activeClientId}` : STORAGE_KEY;
}

export function readParkingState(): ParkingState {
  if (typeof window === "undefined") return DEFAULT_PARKING_STATE;
  try {
    const raw = window.localStorage.getItem(cacheKey());
    if (!raw) return DEFAULT_PARKING_STATE;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_PARKING_STATE;
  }
}

export function writeParkingState(next: ParkingState): ParkingState {
  const normalized = normalize(next);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(cacheKey(), JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: normalized }));
    } catch {
      /* ignore */
    }
  }
  return normalized;
}

export function useParkingState(): [ParkingState, (next: ParkingState) => void] {
  const [state, setState] = useState<ParkingState>(DEFAULT_PARKING_STATE);

  useEffect(() => {
    setState(readParkingState());
    const onChange = () => setState(readParkingState());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const cleanup = () => {
      cancelled = true;
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };

    if (!CLOUD_SYNC_ENABLED) return cleanup;

    (async () => {
      try {
        const res = await loadSharedState({ data: { key: CLOUD_KEY } });
        if (cancelled) return;
        if (res?.orgId) activeClientId = String(res.orgId);
        if (res?.data && typeof res.data === "object") {
          const cloud = normalize(res.data);
          writeParkingState(cloud);
          setState(cloud);
        } else {
          // A client with no saved board starts blank; nothing is copied over
          // from whichever client was open before.
          setState(writeParkingState(DEFAULT_PARKING_STATE));
        }
      } catch (e) {
        console.warn("Parking lot cloud sync is unavailable", e);
      }
    })();


    // Live updates: realtime pushes counts submitted from a phone straight to
    // any open dashboard or weekly summary. Polling is the safety net when a
    // realtime socket cannot connect (locked-down networks, sleeping tabs).
    const pull = async () => {
      try {
        const res = await loadSharedState({ data: { key: CLOUD_KEY } });
        if (cancelled || !res?.data || typeof res.data !== "object") return;
        const cloud = normalize(res.data);
        const local = readParkingState();
        if (JSON.stringify(cloud) === JSON.stringify(local)) return;
        setState(writeParkingState(cloud));
      } catch {
        /* offline: keep showing the last known counts */
      }
    };

    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void pull();
    }, 10000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVisible);

    const stopTimers = () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };

    try {
      channel = supabase
        .channel("kairos_parking_lots_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "kairos_state",
            filter: `key=eq.${CLOUD_KEY}`,
          },
          (payload: { eventType: string; new: { data?: unknown } }) => {
            if (payload.eventType === "DELETE") return;
            const data = payload.new?.data;
            if (!data || typeof data !== "object") return;
            setState(writeParkingState(normalize(data)));
          },
        )
        .subscribe();
    } catch (e) {
      console.warn("Parking lot realtime sync is unavailable", e);
    }

    return () => {
      stopTimers();
      cleanup();
    };
  }, []);


  const update = (next: ParkingState) => {
    const normalized = writeParkingState(next);
    setState(normalized);
    if (!CLOUD_SYNC_ENABLED) return;
    void pushSharedState(CLOUD_KEY, normalized);
  };

  return [state, update];
}
