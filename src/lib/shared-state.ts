import { saveSharedState } from "./shared-state.functions";
import { ensureDeviceCode, getDeviceCode } from "./device-access";

/**
 * Saves a shared board record (annotations, landmarks, parking lots, fleet
 * counts) through the server, which checks the device access code first.
 *
 * `prompt: false` is used for background/seed saves so a viewer device is never
 * interrupted; those simply skip syncing when the device has no code yet.
 */
export async function pushSharedState(
  key: string,
  data: unknown,
  opts?: { prompt?: boolean },
): Promise<boolean> {
  const code = opts?.prompt === false ? getDeviceCode() : await ensureDeviceCode();
  if (!code) return false;
  try {
    await saveSharedState({ data: { code, key, data } });
    return true;
  } catch (e) {
    console.warn(`Could not save ${key} to the cloud`, e);
    return false;
  }
}
