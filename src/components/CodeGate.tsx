import { useState } from "react";
import { verifyDeviceCode } from "@/lib/traffic-plans.functions";
import { setDeviceCode } from "@/lib/device-access";

/**
 * Inline access-code entry. Replaces the old browser prompt so operators can
 * see what they are typing, read the error, and get told who hands out codes.
 */
export default function CodeGate({ onUnlock }: { onUnlock: (code: string) => void | Promise<void> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = value.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      await verifyDeviceCode({ data: { code } });
      setDeviceCode(code);
      await onUnlock(code);
    } catch {
      setError("That access code is not recognized (or has been revoked).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="ACCESS CODE"
          className="h-9 px-3 rounded-lg bg-bg-deep border border-white/10 font-mono text-sm tracking-widest text-white focus:outline-none focus:border-kairos-blue"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="h-9 px-4 rounded-lg bg-kairos-gold text-bg-deep text-xs font-bold disabled:opacity-40"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </div>
      {error && <div className="text-[11px] text-red-400">{error}</div>}
      <p className="text-[11px] text-slate-500">
        Codes are issued by the Kairos project owner. Once you are in as an admin, you can create and revoke codes for
        anyone else from the Invited Devices list on the Admin page.
      </p>
    </form>
  );
}
