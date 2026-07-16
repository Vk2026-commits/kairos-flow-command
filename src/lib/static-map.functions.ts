import { createServerFn } from "@tanstack/react-start";

type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

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
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmKey) {
      throw new Error("Google Maps connector not configured");
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
    });
    params.append(
      "markers",
      `color:red|label:${data.markerLabel ?? "W"}|${data.lat},${data.lng}`,
    );

    const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/staticmap?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Static Maps failed [${response.status}]: ${body}`);
      throw new Error(`Static Maps request failed (${response.status})`);
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
