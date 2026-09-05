import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pushSharedState } from "./shared-state";

const CLOUD_SYNC_ENABLED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
// Lazily resolved: touching the client at module scope throws when backend env
// vars are absent, which would break every page that imports this file.
const cloudDb = () => supabase as any;

const STORAGE_KEY = "kairos.parkingLots.v1";
const EVENT = "kairos:parking-lots-changed";
const CLOUD_KEY = "parking_lots";

export type ParkingLot = {
  id: string;
  name: string;
  color: string;
  spaces: number;
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


export const DEFAULT_PARKING_STATE: ParkingState = {
  lots: [
    { id: "yellow", name: "Yellow Lot", color: "#eab308", spaces: 0 },
    { id: "green", name: "Green Lot", color: "#22c55e", spaces: 0 },
    { id: "red", name: "Red Lot", color: "#ef4444", spaces: 0 },
    { id: "purple", name: "Purple Lot", color: "#a855f7", spaces: 0 },
    { id: "handicap", name: "Handicap Lot", color: "#38bdf8", spaces: 0 },
    { id: "matthew25", name: "Matthew 25 Lot", color: "#f97316", spaces: 0 },
  ],
  counts: [],
};

function num(n: unknown, max = 100000) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(max, v);
}

function normalize(raw: unknown): ParkingState {
  const obj = (raw ?? {}) as Partial<ParkingState>;
  const lots = Array.isArray(obj.lots) && obj.lots.length > 0
    ? obj.lots.map((l, i) => ({
        id: String(l?.id ?? `lot-${i}`),
        name: String(l?.name ?? `Lot ${i + 1}`),
        color: String(l?.color ?? "#64748b"),
        spaces: num(l?.spaces, 20000),
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
          serviceId: c?.serviceId ? String(c.serviceId) : undefined,
          date: c?.date ? String(c.date) : toDateKey(String(c?.at ?? "")),


        }))
        .filter((c) => c.lotId)
    : [];
  return { lots, counts };
}

export function readParkingState(): ParkingState {
  if (typeof window === "undefined") return DEFAULT_PARKING_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
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
        const local = readParkingState();
        const { data, error } = await cloudDb()
          .from("kairos_state")
          .select("data")
          .eq("key", CLOUD_KEY)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        if (data?.data && typeof data.data === "object") {
          const cloud = normalize(data.data);
          writeParkingState(cloud);
          setState(cloud);
        } else {
          await pushSharedState(CLOUD_KEY, local, { prompt: false });
        }
      } catch (e) {
        console.warn("Parking lot cloud sync is unavailable", e);
      }
    })();

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

    return cleanup;
  }, []);

  const update = (next: ParkingState) => {
    const normalized = writeParkingState(next);
    setState(normalized);
    if (!CLOUD_SYNC_ENABLED) return;
    void pushSharedState(CLOUD_KEY, normalized);
  };

  return [state, update];
}
