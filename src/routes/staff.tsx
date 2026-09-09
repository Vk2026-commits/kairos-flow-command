import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import ConsultingProgress from "@/components/ConsultingProgress";
import { ParkingLotsPanel } from "@/components/ParkingLotsPanel";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Portal | Kairos Command" },
      {
        name: "description",
        content:
          "Staff portal for Kairos Command: consulting progress and parking lot counts for signed-in executives and consultants.",
      },
      { property: "og:title", content: "Staff Portal | Kairos Command" },
      {
        property: "og:description",
        content: "Consulting progress and parking lot counts for signed-in Kairos staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffPortal,
});

type Tab = "consulting" | "lots";

function StaffPortal() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("consulting");

  useEffect(() => {
    let done = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (done) return;
      if (!data.user) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      setEmail(data.user.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") void navigate({ to: "/auth", replace: true });
    });
    return () => {
      done = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-deep text-slate-400 font-sans grid place-items-center text-xs uppercase tracking-widest">
        Checking your sign in…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans">
      <header className="border-b border-white/5 bg-surface/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
            Kairos Command<span className="text-kairos-gold">™</span>
            <span className="ml-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Staff Portal
            </span>
          </h1>
          {email && <p className="text-[11px] text-slate-500 mt-0.5">{email}</p>}
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 p-1">
            {(
              [
                { id: "consulting" as Tab, label: "Consulting" },
                { id: "lots" as Tab, label: "Parking Lots" },
              ]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                  tab === t.id ? "bg-kairos-blue text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <Link
            to="/lots-mobile"
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition"
          >
            Phone view
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {tab === "consulting" ? (
        <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <ConsultingProgress />
        </main>
      ) : (
        <main className="h-[calc(100vh-64px)] flex flex-col">
          <ParkingLotsPanel />
        </main>
      )}
    </div>
  );
}
