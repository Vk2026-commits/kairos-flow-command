import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | Kairos Command" },
      {
        name: "description",
        content: "Set a new password for your Kairos Command staff account.",
      },
      { property: "og:title", content: "Reset Password | Kairos Command" },
      {
        property: "og:description",
        content: "Set a new password for your Kairos Command staff account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link lands here with a token in the URL hash; the client
    // exchanges it for a recovery session automatically.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      if (window.location.hash.includes("type=recovery")) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      void navigate({ to: "/staff", replace: true });
    } catch (err) {
      setError((err as Error).message || "Could not update the password. Please try the link again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans flex flex-col">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-surface/60 backdrop-blur-md">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Kairos Command<span className="text-kairos-gold">™</span>
          <span className="ml-3 text-xs font-mono tracking-widest text-slate-500 uppercase">Reset Password</span>
        </h1>
        <Link
          to="/auth"
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
        >
          ← Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-surface p-6 mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Choose a new password</h2>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Enter your new password below. After saving you'll be taken straight to the Staff Portal.
          </p>

          {!ready && (
            <p className="text-[11px] text-amber-400 mb-4">
              This page only works from the reset link in your email. If you opened it directly, go back and use
              “Forgot password?” on the sign-in page.
            </p>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className={labelCls} htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                className={inputCls}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <div className="text-[11px] text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={busy || !ready}
              className="w-full h-10 rounded-lg bg-kairos-blue text-white text-sm font-bold disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
