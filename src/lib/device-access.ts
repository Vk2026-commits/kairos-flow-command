import { verifyDeviceCode } from "./traffic-plans.functions";

// Shared devices stay logged-in-free: instead of accounts we remember a device
// access code that an admin hands out, and only invited codes can sync plans.
const CODE_KEY = "kairos:device-code:v1";

export function getDeviceCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function setDeviceCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Returns a verified device access code, prompting once if this device has not
 * been invited yet. Returns null when the operator cancels or the code is bad.
 */
export async function ensureDeviceCode(opts?: { force?: boolean }): Promise<string | null> {
  const stored = getDeviceCode();
  if (stored && !opts?.force) {
    try {
      const res: any = await verifyDeviceCode({ data: { code: stored } });
      if (res?.ok) return stored;
      setDeviceCode(null);
    } catch {
      setDeviceCode(null);
    }
  }
  const entered = window
    .prompt("Enter this device's Command Hub access code to sync traffic plans:")
    ?.trim()
    .toUpperCase();
  if (!entered) return null;
  try {
    const res: any = await verifyDeviceCode({ data: { code: entered } });
    if (!res?.ok) {
      window.alert("That access code is not invited (or has been revoked).");
      return null;
    }
    setDeviceCode(entered);
    return entered;
  } catch {
    window.alert("Could not check that code right now. Please try again.");
    return null;
  }
}

