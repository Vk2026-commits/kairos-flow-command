import { useEffect, useState } from "react";

/**
 * Admin-configurable fleet counts. Persisted to localStorage so the
 * presentation dashboard (Chapter 10) and live-ops stat cards reflect the
 * active vehicle mix without editing source code.
 */

export type FleetConfig = {
  shuttleCount: number;
  golfCartCount: number;
};

export const DEFAULT_FLEET_CONFIG: FleetConfig = {
  shuttleCount: 2,
  golfCartCount: 1,
};

const STORAGE_KEY = "kairos.fleetConfig.v1";
const EVENT = "kairos:fleet-config-changed";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(Number.isFinite(n) ? n : 0)));
}

function normalize(raw: Partial<FleetConfig> | null | undefined): FleetConfig {
  return {
    shuttleCount: clamp(raw?.shuttleCount ?? DEFAULT_FLEET_CONFIG.shuttleCount, 0, 20),
    golfCartCount: clamp(raw?.golfCartCount ?? DEFAULT_FLEET_CONFIG.golfCartCount, 0, 20),
  };
}

export function readFleetConfig(): FleetConfig {
  if (typeof window === "undefined") return DEFAULT_FLEET_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FLEET_CONFIG;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_FLEET_CONFIG;
  }
}

export function writeFleetConfig(next: FleetConfig) {
  const normalized = normalize(next);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: normalized }));
  }
  return normalized;
}

export function useFleetConfig(): [FleetConfig, (next: FleetConfig) => void] {
  const [config, setConfig] = useState<FleetConfig>(DEFAULT_FLEET_CONFIG);
  useEffect(() => {
    setConfig(readFleetConfig());
    const onChange = () => setConfig(readFleetConfig());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const update = (next: FleetConfig) => setConfig(writeFleetConfig(next));
  return [config, update];
}
