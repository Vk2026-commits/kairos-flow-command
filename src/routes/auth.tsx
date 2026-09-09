import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In | Kairos Command" },
      {
        name: "description",
        content:
          "Sign in to Kairos Command with your own staff account to log consulting hours and view your assessments.",
      },
      { property: "og:title", content: "Staff Sign In | Kairos Command" },
      {
        property: "og:description",
        content: "Executive and consultant sign in for the Kairos Command hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-bg-deep border border-white/10 text-sm text-white focus:outline-none focus:border-kairos-blue";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!done && data.user) void navigate({ to: "/staff", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void navigate({ to: "/staff", replace: true });
    });
    return () => {
      done = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setNotice("Reset link sent. Check your email and click the link to choose a new password.");
        setMode("signin");
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() || undefined },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Account created. Check your email and click the confirmation link, then sign in.");
          setMode("signin");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      }
    } catch (err) {
      setError((err as Error).message || "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      setError((err as Error).message || "Google sign-in is unavailable right now.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans flex flex-col">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-surface/60 backdrop-blur-md">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Kairos Command<span className="text-kairos-gold">™</span>
          <span className="ml-3 text-xs font-mono tracking-widest text-slate-500 uppercase">Staff Sign In</span>
        </h1>
        <Link
          to="/"
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
        >
          ← Dashboard
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-surface p-6 mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            {mode === "forgot"
              ? "Enter the email on your staff account and we'll send you a link to choose a new password."
              : "Every executive and consultant has their own account. Your hours, progress notes and assessments are visible only to you and a full admin."}
          </p>

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={google}
                className="w-full h-10 rounded-lg bg-white text-bg-deep text-sm font-bold mb-4"
              >
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500">or email</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className={labelCls} htmlFor="fullName">
                  Your name
                </label>
                <input
                  id="fullName"
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Stephen Taylor"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className={labelCls} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {error && <div className="text-[11px] text-red-400">{error}</div>}
            {notice && <div className="text-[11px] text-emerald-400">{notice}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-10 rounded-lg bg-kairos-blue text-white text-sm font-bold disabled:opacity-40"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="mt-4 text-[11px] text-slate-400 hover:text-white transition"
          >
            {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>

          <p className="mt-4 text-[11px] text-slate-500">
            The first account created becomes the full admin. Everyone after that starts read-only until an admin
            raises their level on the Admin page.
          </p>
        </div>
      </main>
    </div>
  );
}
