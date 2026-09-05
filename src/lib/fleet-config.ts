import { useEffect, useState } from "react";
import { pushSharedState } from "./shared-state";
import { loadSharedState } from "./shared-state.functions";
import { supabase } from "@/integrations/supabase/client";

// Cloud sync runs through server functions now, so it works without
// browser-side backend credentials.
const CLOUD_SYNC_ENABLED = true;

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
const CLOUD_KEY = "fleet_config";

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

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (!CLOUD_SYNC_ENABLED) {
      return () => {
        window.removeEventListener(EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    }

    (async () => {
      try {
        const local = readFleetConfig();
        const res = await loadSharedState({ data: { key: CLOUD_KEY } });
        const data = { data: res?.data ?? null };
        if (cancelled) return;

        if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
          const cloud = normalize(data.data as Partial<FleetConfig>);
          writeFleetConfig(cloud);
          setConfig(cloud);
        } else {
          await pushSharedState(CLOUD_KEY, local, { prompt: false });
        }
      } catch (e) {
        console.warn("Fleet config cloud sync is unavailable", e);
      }
    })();

    try {
      channel = supabase
        .channel("kairos_fleet_config_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "kairos_state", filter: `key=eq.${CLOUD_KEY}` },
          (payload: { eventType: string; new: { data?: unknown } }) => {
            if (payload.eventType === "DELETE") return;
            const data = payload.new?.data;
            if (!data || typeof data !== "object" || Array.isArray(data)) return;
            const next = writeFleetConfig(normalize(data as Partial<FleetConfig>));
            setConfig(next);
          },
        )
        .subscribe();
    } catch (e) {
      console.warn("Fleet config realtime sync is unavailable", e);
    }

    return () => {
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
  }, []);
  const update = (next: FleetConfig) => {
    const normalized = writeFleetConfig(next);
    setConfig(normalized);
    if (!CLOUD_SYNC_ENABLED) return;
    void pushSharedState(CLOUD_KEY, normalized);
  };
  return [config, update];
}
