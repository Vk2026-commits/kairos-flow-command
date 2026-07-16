/// <reference types="google.maps" />
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Wheeler Avenue Baptist Church — Houston, TX
export const WHEELER_LATLNG = { lat: 29.7269, lng: -95.3572 };

type MapType = "roadmap" | "satellite" | "hybrid";

type Props = {
  center?: { lat: number; lng: number };
  mapType?: MapType;
  streetView?: boolean;
  initialView?: LiveMapView | null;
};

export type LiveMapView = {
  center: { lat: number; lng: number };
  zoom: number;
  mapType: MapType;
  streetView?: boolean;
};

export type LiveMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  search: (query: string) => Promise<{ ok: true; address: string } | { ok: false; error: string }>;
  setInteractive: (enabled: boolean) => void;
  getView: () => LiveMapView | null;
  setView: (v: LiveMapView) => void;
};

let mapsLoader: Promise<typeof google> | null = null;

function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as unknown as { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as unknown as { google: typeof google }).google);
  }
  if (mapsLoader) return mapsLoader;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Missing Google Maps browser key"));

  mapsLoader = new Promise<typeof google>((resolve, reject) => {
    const cbName = `__initGoogleMaps_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      const g = (window as unknown as { google?: typeof google }).google;
      if (g?.maps) resolve(g);
      else reject(new Error("Google Maps failed to initialize"));
      delete (window as unknown as Record<string, unknown>)[cbName];
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      v: "weekly",
      libraries: "geometry",
      callback: cbName,
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(s);
  });

  return mapsLoader;
}

export const LiveMap = forwardRef<LiveMapHandle, Props>(function LiveMap(
  { center = WHEELER_LATLNG, mapType = "hybrid", streetView = false },
  ref,
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<google.maps.Map | null>(null);
  const svInst = useRef<google.maps.StreetViewPanorama | null>(null);
  const markerInst = useRef<google.maps.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const m = mapInst.current;
        if (m) m.setZoom((m.getZoom() ?? 17) + 1);
      },
      zoomOut: () => {
        const m = mapInst.current;
        if (m) m.setZoom(Math.max(1, (m.getZoom() ?? 17) - 1));
      },
      reset: () => {
        const m = mapInst.current;
        if (!m) return;
        m.setZoom(17);
        m.panTo(center);
      },
      search: async (query: string) => {
        const q = query.trim();
        if (!q) return { ok: false as const, error: "Enter an address or intersection." };
        try {
          const g = await loadGoogleMaps();
          const m = mapInst.current;
          if (!m) return { ok: false as const, error: "Map not ready." };
          const geocoder = new g.maps.Geocoder();
          const res = await geocoder.geocode({ address: q });
          const hit = res.results?.[0];
          if (!hit) return { ok: false as const, error: "No results found." };
          const loc = hit.geometry.location;
          const pos = { lat: loc.lat(), lng: loc.lng() };
          m.panTo(pos);
          m.setZoom(18);
          markerInst.current?.setPosition(pos);
          markerInst.current?.setTitle(hit.formatted_address);

          // Sync Street View: find nearest panorama and aim camera at the target.
          const sv = svInst.current;
          if (sv) {
            try {
              const svService = new g.maps.StreetViewService();
              const pano = await svService.getPanorama({
                location: pos,
                radius: 80,
                source: g.maps.StreetViewSource.OUTDOOR,
              });
              const panoPos = pano.data.location?.latLng;
              if (panoPos) {
                const heading = g.maps.geometry?.spherical
                  ? g.maps.geometry.spherical.computeHeading(panoPos, loc)
                  : 0;
                sv.setPano(pano.data.location!.pano!);
                sv.setPov({ heading, pitch: 0 });
                sv.setZoom(1);
              } else {
                sv.setPosition(pos);
              }
            } catch {
              sv.setPosition(pos);
            }
          }
          return { ok: true as const, address: hit.formatted_address };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/ZERO_RESULTS/i.test(msg)) {
            return { ok: false as const, error: "No matches for that address." };
          }
          if (/OVER_QUERY_LIMIT|OVER_DAILY_LIMIT/i.test(msg)) {
            return { ok: false as const, error: "Search quota exceeded. Try again later." };
          }
          if (/REQUEST_DENIED/i.test(msg)) {
            return { ok: false as const, error: "Search request denied (API key/permissions)." };
          }
          if (/INVALID_REQUEST/i.test(msg)) {
            return { ok: false as const, error: "Invalid search query." };
          }
          if (/network|Failed to fetch/i.test(msg)) {
            return { ok: false as const, error: "Network error — check your connection." };
          }
          return { ok: false as const, error: `Search failed: ${msg}` };
        }
      },
      getView: () => {
        const m = mapInst.current;
        if (!m) return null;
        const c = m.getCenter();
        if (!c) return null;
        return {
          center: { lat: c.lat(), lng: c.lng() },
          zoom: m.getZoom() ?? 17,
          mapType: (m.getMapTypeId() as MapType) ?? "hybrid",
        };
      },
      setView: (v) => {
        const m = mapInst.current;
        if (!m) return;
        m.setMapTypeId(v.mapType);
        m.setZoom(v.zoom);
        m.panTo(v.center);
        markerInst.current?.setPosition(v.center);
        svInst.current?.setPosition(v.center);
      },
      setInteractive: (enabled: boolean) => {
        const opts: google.maps.MapOptions = {
          draggable: enabled,
          scrollwheel: enabled,
          disableDoubleClickZoom: !enabled,
          keyboardShortcuts: enabled,
          gestureHandling: enabled ? "auto" : "none",
          zoomControl: enabled,
          streetViewControl: enabled,
        };
        mapInst.current?.setOptions(opts);
        svInst.current?.setOptions({
          clickToGo: enabled,
          scrollwheel: enabled,
          disableDoubleClickZoom: !enabled,
          linksControl: enabled,
          panControl: enabled,
          zoomControl: enabled,
        });
      },
    }),
    [center],
  );

  // Initial load
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapRef.current) return;
        mapInst.current = new g.maps.Map(mapRef.current, {
          center,
          zoom: 17,
          mapTypeId: mapType,
          disableDefaultUI: false,
          streetViewControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
        });
        markerInst.current = new g.maps.Marker({
          position: center,
          map: mapInst.current,
          title: "Wheeler Ave Baptist Church",
        });
        if (svRef.current) {
          svInst.current = new g.maps.StreetViewPanorama(svRef.current, {
            position: center,
            pov: { heading: 90, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
          });
          mapInst.current.setStreetView(svInst.current);
        }
        setLoaded(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded || !mapInst.current) return;
    mapInst.current.setMapTypeId(mapType);
  }, [mapType, loaded]);

  useEffect(() => {
    if (!loaded || !mapInst.current) return;
    mapInst.current.panTo(center);
    markerInst.current?.setPosition(center);
    svInst.current?.setPosition(center);
  }, [center, loaded]);

  return (
    <div className="w-full h-full relative bg-bg-deep">
      <div
        ref={mapRef}
        className={`absolute inset-0 ${streetView ? "hidden md:block md:right-1/2" : ""}`}
        style={streetView ? { right: "50%" } : undefined}
      />
      <div
        ref={svRef}
        className={`absolute inset-0 ${streetView ? "block md:left-1/2" : "hidden"}`}
        style={streetView ? { left: "50%" } : undefined}
      />
      {!loaded && !error && (
        <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs font-mono">
          Loading Google Maps…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">
              Map failed to load
            </p>
            <p className="text-slate-400 text-[11px] mt-2">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
});
