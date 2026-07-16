/// <reference types="google.maps" />
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Wheeler Avenue Baptist Church — Houston, TX
export const WHEELER_LATLNG = { lat: 29.7269, lng: -95.3572 };

type MapType = "roadmap" | "satellite" | "hybrid";

type Props = {
  center?: { lat: number; lng: number };
  mapType?: MapType;
  streetView?: boolean;
};

export type LiveMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
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
