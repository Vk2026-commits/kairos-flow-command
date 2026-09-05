import { createFileRoute, Link } from "@tanstack/react-router";
import ConsultingProgress from "@/components/ConsultingProgress";

export const Route = createFileRoute("/consulting")({
  head: () => ({
    meta: [
      { title: "Kairos Command™ — Consulting Progress" },
      {
        name: "description",
        content:
          "Executive view of Kairos consulting progress: work completed, site visits, recommendations, action items and upcoming milestones.",
      },
      { property: "og:title", content: "Kairos Command™ — Consulting Progress" },
      {
        property: "og:description",
        content: "Consulting progress, site visit history and executive reporting for Wheeler Avenue Baptist Church.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultingPage,
});

function ConsultingPage() {
  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 font-sans">
      <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-surface/60 backdrop-blur-md print:hidden">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Kairos Command<span className="text-kairos-gold">™</span>
          <span className="ml-3 text-xs font-mono tracking-widest text-slate-500 uppercase">
            Admin · Consulting Progress
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-xs font-semibold text-slate-400 hover:text-white transition">
            Admin
          </Link>
          <Link
            to="/"
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 lg:p-8">
        <ConsultingProgress />
      </main>
    </div>
  );
}
