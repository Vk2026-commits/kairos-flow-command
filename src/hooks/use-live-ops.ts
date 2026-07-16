import { useEffect, useState } from "react";

/**
 * Shared live operational data source. Powers dashboard KPIs and every
 * presentation slide that shows shuttle / parking / personnel / KPI numbers,
 * so the meeting sees the same real-time values the command center sees.
 *
 * Simulated on the client for demo/pre-award. When the production telemetry
 * endpoint is wired up, swap the interval below for a websocket / server-fn
 * subscription — every consumer will update automatically.
 */

export type ShuttleStatus = "Loading" | "Moving" | "Departure" | "Staging";
export type VehicleType = "shuttle" | "golf-cart";

export type Shuttle = {
  id: string;
  type: VehicleType;
  loc: string;
  pax: number;
  cycleSec: number; // seconds since cycle start
  status: ShuttleStatus;
  trips: number;
};

export type LiveOps = {
  updatedAt: Date;
  parkingFillPct: number;         // 0-100
  avgShuttleCycleMin: number;     // minutes, one decimal
  activePersonnel: number;        // of totalPersonnel
  totalPersonnel: number;
  incidentsOpen: number;
  vehiclesActive: number;
  systemUptimePct: number;
  avgWaitSec: number;
  passengersPerHour: number;
  guestSatisfaction: number;      // 0-5
  vehicleReadinessPct: number;
  staffAttendancePct: number;
  incidentRatePct: number;
  trafficClearanceMin: number;
  shuttles: Shuttle[];
};

const LOCS = [
  "UH Lot 12",
  "Enroute → Church",
  "Church Curb",
  "TSU Overflow",
  "Staging Area",
];
const STATUSES: ShuttleStatus[] = ["Loading", "Moving", "Departure", "Staging"];

function jitter(base: number, spread: number, decimals = 0) {
  const v = base + (Math.random() - 0.5) * spread * 2;
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}

function seed(): LiveOps {
  return {
    updatedAt: new Date(),
    parkingFillPct: 84,
    avgShuttleCycleMin: 12.4,
    activePersonnel: 58,
    totalPersonnel: 62,
    incidentsOpen: 0,
    vehiclesActive: 7,
    systemUptimePct: 99.9,
    avgWaitSec: 222,
    passengersPerHour: 612,
    guestSatisfaction: 4.8,
    vehicleReadinessPct: 100,
    staffAttendancePct: 99.4,
    incidentRatePct: 0.02,
    trafficClearanceMin: 13,
    shuttles: [
      { id: "S-01", loc: "UH Lot 12",         pax: 24, cycleSec: 12 * 60 + 40, status: "Loading" },
      { id: "S-02", loc: "Enroute → Church",  pax: 31, cycleSec: 11 * 60 + 20, status: "Moving" },
      { id: "S-03", loc: "Church Curb",       pax: 0,  cycleSec: 13 * 60 + 5,  status: "Departure" },
      { id: "S-04", loc: "TSU Overflow",      pax: 18, cycleSec: 14 * 60 + 10, status: "Loading" },
    ],
  };
}

function step(prev: LiveOps): LiveOps {
  return {
    updatedAt: new Date(),
    parkingFillPct: Math.max(70, Math.min(95, jitter(prev.parkingFillPct, 1))),
    avgShuttleCycleMin: Math.max(10, Math.min(14, jitter(prev.avgShuttleCycleMin, 0.2, 1))),
    activePersonnel: Math.max(54, Math.min(62, prev.activePersonnel + (Math.random() < 0.15 ? (Math.random() < 0.5 ? -1 : 1) : 0))),
    totalPersonnel: prev.totalPersonnel,
    incidentsOpen: Math.random() < 0.02 ? 1 : 0,
    vehiclesActive: 7,
    systemUptimePct: 99.9,
    avgWaitSec: Math.max(180, Math.min(280, Math.round(jitter(prev.avgWaitSec, 6)))),
    passengersPerHour: Math.max(560, Math.min(680, Math.round(jitter(prev.passengersPerHour, 8)))),
    guestSatisfaction: Math.max(4.5, Math.min(5, jitter(prev.guestSatisfaction, 0.03, 2))),
    vehicleReadinessPct: 100,
    staffAttendancePct: Math.max(98, Math.min(100, jitter(prev.staffAttendancePct, 0.1, 1))),
    incidentRatePct: 0.02,
    trafficClearanceMin: Math.max(11, Math.min(15, Math.round(jitter(prev.trafficClearanceMin, 0.5)))),
    shuttles: prev.shuttles.map((s, i) => {
      const cycleSec = (s.cycleSec + 5) % (15 * 60);
      const status = STATUSES[(STATUSES.indexOf(s.status) + (Math.random() < 0.08 ? 1 : 0)) % STATUSES.length];
      const loc = Math.random() < 0.08 ? LOCS[(LOCS.indexOf(s.loc) + 1) % LOCS.length] : s.loc;
      const pax = status === "Departure" ? 0 : Math.max(0, Math.min(36, s.pax + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0)));
      return { id: s.id, loc, pax, cycleSec, status };
    }),
  };
}

export function formatCycle(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useLiveOps(intervalMs = 3000): LiveOps {
  const [data, setData] = useState<LiveOps>(() => seed());
  useEffect(() => {
    const id = setInterval(() => setData((p) => step(p)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return data;
}
