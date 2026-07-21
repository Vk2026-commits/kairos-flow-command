import { createServerFn } from "@tanstack/react-start";

type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";
const FALLBACK_GOOGLE_MAPS_KEY = "AIzaSyBQ-BDvsL4yEcbL6kYhbmaLiuE7TuVGl9s";

export type StaticMapInput = {
  lat: number;
  lng: number;
  zoom: number;
  width: number; // requested px
  height: number; // requested px
  mapType?: MapType;
  markerLabel?: string;
};

export const fetchStaticMap = createServerFn({ method: "POST" })
  .inputValidator((input: StaticMapInput) => {
    if (
      typeof input?.lat !== "number" ||
      typeof input?.lng !== "number" ||
      typeof input?.zoom !== "number" ||
      typeof input?.width !== "number" ||
      typeof input?.height !== "number"
    ) {
      throw new Error("Invalid static map request");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const googleMapsApiKey =
      process.env.GOOGLE_MAPS_STATIC_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
      FALLBACK_GOOGLE_MAPS_KEY;
    if (!googleMapsApiKey) {
      throw new Error(
        "Google Maps Static API key not configured. Set GOOGLE_MAPS_STATIC_API_KEY or GOOGLE_MAPS_API_KEY.",
      );
    }

    // Google Static Maps caps size at 640x640, with scale=2 yielding 1280x1280 output.
    const w = Math.max(200, Math.min(640, Math.round(data.width)));
    const h = Math.max(200, Math.min(640, Math.round(data.height)));
    const zoom = Math.max(1, Math.min(21, Math.round(data.zoom)));
    const mapType = data.mapType ?? "hybrid";

    const params = new URLSearchParams({
      center: `${data.lat},${data.lng}`,
      zoom: String(zoom),
      size: `${w}x${h}`,
      scale: "2",
      maptype: mapType,
      format: "png",
      key: googleMapsApiKey,
    });
    params.append(
      "markers",
      `color:red|label:${data.markerLabel ?? "W"}|${data.lat},${data.lng}`,
    );

    const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      console.error(`Static Maps failed [${response.status}]: ${body}`);
      if (response.status === 403) {
        let reason: string | undefined;
        try {
          const parsed = JSON.parse(body) as {
            error?: { details?: Array<{ reason?: string }> };
          };
          reason = parsed.error?.details?.find((detail) => detail.reason)?.reason;
        } catch {
          // Preserve the provider response in the server log above.
        }
        if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
          throw new Error(
            'Google Maps server key is referrer-restricted. Set its application restrictions to "None" or "IP addresses" in Google Cloud Console.',
          );
        }
        if (reason === "API_KEY_SERVICE_BLOCKED") {
          throw new Error(
            "Google Maps server key does not allow the Maps Static API. Add it to the key's allowed APIs in Google Cloud Console.",
          );
        }
        throw new Error(
          "Google Maps request was denied. Check the server key restrictions in Google Cloud Console.",
        );
      }
      throw new Error(`Static Maps request failed [${response.status}]: ${body}`);
    }

    const buf = new Uint8Array(await response.arrayBuffer());
    // Base64 encode
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    return {
      dataUrl: `data:image/png;base64,${base64}`,
      width: w * 2,
      height: h * 2,
    };
  });
