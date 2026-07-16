import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Play, ChevronLeft, ChevronRight, Home, Building2, Users, AlertTriangle,
  Sparkles, Map as MapIcon, ArrowRightCircle, ArrowLeftCircle, ParkingCircle,
  Bus, HandshakeIcon, MonitorPlay, Gauge, Smartphone, Network, Truck,
  ShieldCheck, CalendarClock, DollarSign, Trophy, MessageCircleQuestion,
  CheckCircle2, Circle, Radio, Clock, MapPin, Wifi, Camera, FileText,
  BadgeCheck, Activity, Award, Timer, TrendingUp, Zap, Eye, HeartHandshake,
  BookOpen, ChevronDown,
} from "lucide-react";
import { MapPanel } from "@/components/MapPanel";
import { useLiveOps, formatCycle } from "@/hooks/use-live-ops";
import { useFleetConfig } from "@/lib/fleet-config";
import { speakerNotes } from "@/lib/speaker-notes";

/* Speaker Notes — collapsible section shown at the bottom of every chapter. */
function SpeakerNotes({ n }: { n: number }) {
  const [open, setOpen] = useState(false);
  const note = speakerNotes[n];
  if (!note) return null;
  return (
    <div className="mt-10 rounded-2xl border border-kairos-gold/25 bg-gradient-to-b from-kairos-gold/[0.06] to-transparent">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02] transition rounded-2xl"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-kairos-gold/15 border border-kairos-gold/40 grid place-items-center">
            <BookOpen className="size-5 text-kairos-gold" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.35em] font-mono text-kairos-gold">SPEAKER NOTES</div>
            <div className="text-sm text-white/80 mt-0.5">{note.summary}</div>
          </div>
        </div>
        <ChevronDown className={`size-5 text-kairos-gold shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 space-y-4 fade-in-up">
          {note.blocks.map((b, i) => (
            <div key={i} className="border-l-2 border-kairos-gold/40 pl-4">
              {b.heading && <div className="font-semibold text-white mb-1">{b.heading}</div>}
              <p className="text-sm text-white/70 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Kairos Executive Presentation — Wheeler Avenue Baptist Church" },
      { name: "description", content: "Interactive executive proposal presentation for Wheeler Avenue Baptist Church." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresentationApp,
});

type Chapter = { n: number; title: string; icon: React.ComponentType<{ className?: string }>; render: () => React.ReactElement };

function PresentationApp() {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);

  const chapters: Chapter[] = useMemo(() => [
    { n: 1, title: "Welcome", icon: Home, render: Slide1Welcome },
    { n: 2, title: "Who Is Kairos", icon: Building2, render: Slide2Who },
    { n: 3, title: "Understanding Wheeler", icon: Users, render: Slide3Wheeler },
    { n: 4, title: "Current Challenges", icon: AlertTriangle, render: Slide4Challenge },
    { n: 5, title: "Our Solution", icon: Sparkles, render: Slide5Solution },
    { n: 6, title: "Interactive Campus Map", icon: MapIcon, render: Slide6Map },
    { n: 7, title: "Ingress Plan", icon: ArrowRightCircle, render: Slide7Ingress },
    { n: 8, title: "Egress Plan", icon: ArrowLeftCircle, render: Slide8Egress },
    { n: 9, title: "Parking Operations", icon: ParkingCircle, render: Slide9Parking },
    { n: 10, title: "Shuttle Operations", icon: Bus, render: Slide10Shuttle },
    { n: 11, title: "First Touch Partnership", icon: HeartHandshake, render: Slide11FirstTouch },
    { n: 12, title: "Ops Command Center", icon: MonitorPlay, render: Slide12Command },
    { n: 13, title: "Performance KPIs", icon: Gauge, render: Slide13KPI },
    { n: 14, title: "Technology Platform", icon: Smartphone, render: Slide14Tech },
    { n: 15, title: "Staffing", icon: Network, render: Slide15Staffing },
    { n: 16, title: "Vehicle Fleet", icon: Truck, render: Slide16Fleet },
    { n: 17, title: "Safety Program", icon: ShieldCheck, render: Slide17Safety },
    { n: 18, title: "Implementation", icon: CalendarClock, render: Slide18Timeline },
    { n: 19, title: "Pricing", icon: DollarSign, render: Slide19Pricing },
    { n: 20, title: "Why Kairos", icon: Trophy, render: Slide20Why },
    { n: 21, title: "Questions", icon: MessageCircleQuestion, render: Slide21Questions },
  ], []);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setIdx((i) => Math.min(i + 1, chapters.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Escape") setStarted(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, chapters.length]);

  if (!started) return <PresentationHome onBegin={() => { setIdx(0); setStarted(true); }} />;

  const Chap = chapters[idx];

  return (
    <div className="min-h-screen bg-bg-deep text-foreground flex">
      {/* Left nav */}
      <aside className="w-64 shrink-0 border-r border-white/5 bg-surface/60 backdrop-blur h-screen sticky top-0 flex flex-col">
        <button
          onClick={() => setStarted(false)}
          className="p-4 border-b border-white/5 flex items-center gap-2 hover:bg-white/5 transition"
        >
          <div className="size-8 rounded-md bg-kairos-blue/20 border border-kairos-blue/40 grid place-items-center">
            <Sparkles className="size-4 text-kairos-blue" />
          </div>
          <div className="text-left">
            <div className="text-[10px] tracking-widest text-muted-foreground">KAIROS</div>
            <div className="text-xs font-semibold">Executive Deck</div>
          </div>
        </button>
        <div className="flex-1 overflow-y-auto py-2">
          {chapters.map((c, i) => {
            const Ico = c.icon;
            const active = i === idx;
            return (
              <button
                key={c.n}
                onClick={() => setIdx(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 text-xs transition border-l-2 ${
                  active
                    ? "bg-kairos-blue/10 border-kairos-blue text-white"
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="font-mono text-[10px] w-5 text-right opacity-60">{String(c.n).padStart(2, "0")}</span>
                <Ico className="size-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-white/5 text-[10px] text-muted-foreground font-mono">
          <div>WHEELER AVENUE BAPTIST</div>
          <div className="opacity-60">Executive Proposal 2026</div>
        </div>
      </aside>

      {/* Slide area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen">
        <header className="h-12 shrink-0 border-b border-white/5 flex items-center justify-between px-4 bg-surface/40">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-muted-foreground">CHAPTER {String(Chap.n).padStart(2, "0")}</span>
            <span className="text-white/80 font-semibold">{Chap.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <NavBtn onClick={() => setIdx((i) => Math.max(i - 1, 0))} disabled={idx === 0}>
              <ChevronLeft className="size-4" />
            </NavBtn>
            <div className="text-[10px] font-mono text-muted-foreground w-16 text-center">
              {idx + 1} / {chapters.length}
            </div>
            <NavBtn onClick={() => setIdx((i) => Math.min(i + 1, chapters.length - 1))} disabled={idx === chapters.length - 1}>
              <ChevronRight className="size-4" />
            </NavBtn>
          </div>
        </header>
        <div key={idx} className="flex-1 overflow-auto fade-in-up">
          <Chap.render />
        </div>
      </main>
    </div>
  );
}

function NavBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="size-8 grid place-items-center rounded-md border border-white/10 bg-surface hover:border-kairos-blue/50 hover:bg-kairos-blue/10 disabled:opacity-30 disabled:pointer-events-none transition"
    >
      {children}
    </button>
  );
}

/* ============================================================
   HOME
============================================================ */
function PresentationHome({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-deep flex items-center justify-center px-6">
      {/* Animated backdrop */}
      <div className="absolute inset-0 map-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,98,255,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.15),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kairos-blue to-transparent" />

      <Link to="/" className="absolute top-6 left-6 text-[10px] font-mono text-muted-foreground hover:text-white flex items-center gap-2 z-10">
        <ChevronLeft className="size-3" /> BACK TO COMMAND
      </Link>

      <div className="relative z-10 max-w-4xl w-full text-center fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-kairos-blue/40 bg-kairos-blue/10 text-[10px] font-mono tracking-widest text-kairos-blue mb-8">
          <span className="size-1.5 rounded-full bg-kairos-blue animate-pulse" />
          EXECUTIVE PRESENTATION CENTER
        </div>

        <div className="text-xs tracking-[0.4em] text-muted-foreground mb-3">KAIROS SECURITY</div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-glow-blue mb-4">
          Professional Transportation
          <br />
          <span className="bg-gradient-to-r from-kairos-blue via-white to-kairos-gold bg-clip-text text-transparent">
            Operations Partner
          </span>
        </h1>

        <div className="text-sm tracking-[0.3em] text-muted-foreground my-6">FOR</div>
        <div className="text-3xl md:text-4xl font-semibold text-white mb-2">Wheeler Avenue Baptist Church</div>
        <div className="text-kairos-gold italic text-lg mb-10">"Moving People With Excellence."</div>

        <button
          onClick={onBegin}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-kairos-blue to-kairos-blue/80 hover:from-kairos-blue hover:to-kairos-blue text-white font-semibold text-lg shadow-[0_0_40px_rgba(0,98,255,0.4)] hover:shadow-[0_0_60px_rgba(0,98,255,0.6)] transition-all hover:scale-[1.02]"
        >
          <Play className="size-5 fill-current" />
          Begin Presentation
          <span className="text-[10px] font-mono opacity-70 ml-2 border-l border-white/30 pl-2">90 MIN</span>
        </button>

        <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
          {[
            { i: Users, l: "Executive Team" },
            { i: FileText, l: "Overview" },
            { i: MapIcon, l: "Interactive Maps" },
            { i: Activity, l: "Operational Plan" },
            { i: MonitorPlay, l: "Live Demo" },
            { i: MessageCircleQuestion, l: "Questions" },
          ].map(({ i: Ico, l }) => (
            <div key={l} className="p-3 rounded-lg border border-white/5 bg-surface/40 backdrop-blur text-center">
              <Ico className="size-4 mx-auto text-kairos-blue mb-2" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Shared slide building blocks
============================================================ */
function SlideShell({ eyebrow, title, subtitle, children }: {
  eyebrow?: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto">
      {eyebrow && <div className="text-[10px] tracking-[0.35em] text-kairos-blue font-mono mb-3">{eyebrow}</div>}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-lg mb-8 max-w-3xl">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, accent = "blue" }: { label: string; value: string; sub?: string; accent?: "blue" | "gold" }) {
  return (
    <div className="p-5 rounded-xl border border-white/5 bg-surface fade-in-up">
      <div className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</div>
      <div className={`mt-2 text-3xl font-bold font-mono ${accent === "gold" ? "text-kairos-gold" : "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function IconTile({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc?: string }) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-surface hover:border-kairos-blue/40 transition fade-in-up">
      <div className="size-10 rounded-lg bg-kairos-blue/15 border border-kairos-blue/30 grid place-items-center mb-3">
        <Icon className="size-5 text-kairos-blue" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
    </div>
  );
}

/* ============================================================
   SLIDE 1 — Welcome
============================================================ */
function Slide1Welcome() {
  return (
    <div className="pb-10">
      <div className="relative min-h-[80vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 map-grid opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,98,255,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-deep" />
        <div className="relative text-center px-6 fade-in-up">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="px-4 py-2 rounded-lg border border-kairos-blue/40 bg-kairos-blue/10 text-xs font-mono tracking-widest text-kairos-blue">
              KAIROS SECURITY
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className="px-4 py-2 rounded-lg border border-kairos-gold/40 bg-kairos-gold/10 text-xs font-mono tracking-widest text-kairos-gold">
              WHEELER AVENUE
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-glow-blue max-w-4xl mx-auto">
            Transportation Excellence
            <br />
            <span className="text-kairos-gold italic">Begins Before Worship.</span>
          </h1>
          <div className="mt-10 text-[10px] font-mono tracking-widest text-muted-foreground">
            PRESS <kbd className="px-2 py-1 rounded bg-white/10">→</kbd> TO BEGIN PRESENTATION
          </div>
        </div>
      </div>
      <div className="px-8 md:px-12 max-w-[1600px] mx-auto">
        <SpeakerNotes n={1} />
      </div>
    </div>
  );
}

/* SLIDE 2 — Who Is Kairos */
function Slide2Who() {
  const highlights = [
    { i: Building2, l: "10 Years in Business" },
    { i: MapPin, l: "Houston Based" },
    { i: BadgeCheck, l: "HUB Certified" },
    { i: BadgeCheck, l: "MBE Certified" },
    { i: Bus, l: "Transportation" },
    { i: ParkingCircle, l: "Parking Operations" },
    { i: ShieldCheck, l: "Security" },
    { i: MapIcon, l: "Traffic Management" },
    { i: Activity, l: "Executive Operations" },
  ];
  const certs = [
    { l: "HUB Certified", sub: "State of Texas" },
    { l: "MBE Certified", sub: "Minority Business Enterprise" },
    { l: "Fully Insured", sub: "$5M General Liability" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 02" title="Who Is Kairos" subtitle="Houston-based professional operations firm, already deployed on the Wheeler campus.">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Years in Business" value="10" sub="Est. 2016" />
        <Stat label="On Wheeler Campus" value="3" sub="Consecutive years" accent="gold" />
        <Stat label="Events Annually" value="450+" />
        <Stat label="Guests Served" value="1.2M" sub="2024" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] tracking-widest text-muted-foreground mb-3">CAPABILITIES & CREDENTIALS</div>
          <div className="grid grid-cols-3 gap-3">
            {highlights.map((s) => <IconTile key={s.l} icon={s.i} title={s.l} />)}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-muted-foreground mb-3">CERTIFICATIONS</div>
          <div className="space-y-2">
            {certs.map((c) => (
              <div key={c.l} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-surface">
                <BadgeCheck className="size-5 text-kairos-gold shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{c.l}</div>
                  <div className="text-xs text-muted-foreground">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 p-5 rounded-xl border border-kairos-gold/30 bg-kairos-gold/5">
        <div className="text-kairos-gold text-xs tracking-widest font-mono mb-1">EXISTING PARTNER</div>
        <div className="text-lg">Three years of on-campus experience gives Kairos operational context no other bidder can match.</div>
      </div>
      <SpeakerNotes n={2} />
    </SlideShell>
  );
}

/* SLIDE 3 — Wheeler */
function Slide3Wheeler() {
  const items = [
    { i: Clock, t: "Three Services", d: "7:00 AM · 10:00 AM · 1:00 PM" },
    { i: ParkingCircle, t: "Five Parking Lots", d: "Church · Overflow · UH · TSU" },
    { i: Users, t: "6,000 Guests Every Sunday", d: "Peak weekly attendance" },
    { i: Activity, t: "Continuous Operations", d: "Six-hour operational window" },
    { i: HeartHandshake, t: "Volunteer Ministry", d: "First Touch partnership" },
    { i: Radio, t: "HPD Coordination", d: "Traffic control officers" },
    { i: Sparkles, t: "Guest Experience", d: "Every arrival matters" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 03" title="Understanding Wheeler" subtitle="A high-volume, multi-service, multi-location operation that never stops moving.">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2 row-span-2 p-6 rounded-xl border border-kairos-blue/30 bg-gradient-to-br from-kairos-blue/10 to-transparent">
          <div className="text-[10px] tracking-widest text-kairos-blue font-mono mb-4">SUNDAY BY THE NUMBERS</div>
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-4xl font-bold font-mono">3</div><div className="text-xs text-muted-foreground">Services</div></div>
            <div><div className="text-4xl font-bold font-mono text-kairos-gold">6,000</div><div className="text-xs text-muted-foreground">Guests Every Sunday</div></div>
            <div><div className="text-4xl font-bold font-mono">5</div><div className="text-xs text-muted-foreground">Parking Lots</div></div>
            <div><div className="text-4xl font-bold font-mono">6h</div><div className="text-xs text-muted-foreground">Ops Window</div></div>
          </div>
        </div>
        {items.map((it) => <IconTile key={it.t} icon={it.i} title={it.t} desc={it.d} />)}
      </div>
      <SpeakerNotes n={3} />
    </SlideShell>
  );
}

/* SLIDE 4 — Challenge */
function Slide4Challenge() {
  const problems = [
    { i: Users, t: "Moving People Efficiently" },
    { i: Bus, t: "Moving Buses Through Traffic" },
    { i: ParkingCircle, t: "Moving Cars Off Parking Lots" },
    { i: Timer, t: "Transition Between Services" },
    { i: Gauge, t: "Capacity Constraints" },
    { i: HeartHandshake, t: "Volunteer Limitations" },
    { i: Sparkles, t: "Guest Arrival Experience" },
    { i: AlertTriangle, t: "Traffic Congestion" },
    { i: ShieldCheck, t: "Pedestrian Safety" },
    { i: Radio, t: "Shuttle Coordination" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 04" title="The Problem" subtitle="What Wheeler faces today between services.">
      <div className="grid grid-cols-5 gap-3">
        {problems.map((p, i) => (
          <div
            key={p.t}
            className="p-4 rounded-xl border border-destructive/25 bg-gradient-to-b from-destructive/10 to-transparent hover:border-destructive/50 transition fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="size-10 rounded-lg bg-destructive/15 border border-destructive/40 grid place-items-center mb-3">
              <p.i className="size-5 text-destructive" />
            </div>
            <div className="text-sm font-semibold leading-snug">{p.t}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-6 rounded-2xl border border-kairos-gold/40 bg-gradient-to-br from-kairos-gold/15 to-transparent">
        <div className="text-[10px] font-mono tracking-[0.35em] text-kairos-gold mb-2">
          BIGGEST TAKEAWAY FROM THE Q&amp;A
        </div>
        <div className="text-4xl md:text-5xl font-bold italic text-white">
          "Ingress and Egress."
        </div>
        <div className="mt-3 text-sm text-white/70 max-w-3xl">
          This phrase came up repeatedly throughout the Q&amp;A and represents the Church's highest operational priority.
        </div>
      </div>
      <SpeakerNotes n={4} />
    </SlideShell>
  );
}

/* SLIDE 5 — Solution */
function Slide5Solution() {
  const pillars = ["One Team", "One Command", "One Communication Platform", "One Traffic Plan", "One Guest Experience"];
  const flow = ["Parking", "Shuttle", "Arrival", "Guest Experience", "Departure"];
  const flowIcons = [ParkingCircle, Bus, MapPin, HeartHandshake, ArrowLeftCircle];
  return (
    <SlideShell eyebrow="CHAPTER 05" title="Our Solution" subtitle="A single unified operation, from parking to departure.">
      <div className="grid grid-cols-5 gap-3 mb-10">
        {pillars.map((p, i) => (
          <div key={p} className="p-5 rounded-xl border border-kairos-blue/30 bg-gradient-to-b from-kairos-blue/10 to-transparent text-center fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="text-2xl font-bold text-kairos-blue font-mono">0{i + 1}</div>
            <div className="text-sm font-semibold mt-2">{p}</div>
          </div>
        ))}
      </div>
      <div className="p-6 rounded-2xl border border-white/5 bg-surface">
        <div className="text-[10px] tracking-widest text-muted-foreground mb-6 text-center">UNIFIED GUEST WORKFLOW</div>
        <div className="flex items-center justify-between gap-2">
          {flow.map((step, i) => {
            const Ico = flowIcons[i];
            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className="flex-1 text-center">
                  <div className="size-16 mx-auto rounded-full bg-kairos-blue/15 border-2 border-kairos-blue/50 grid place-items-center mb-2 pulse-blue">
                    <Ico className="size-7 text-kairos-blue" />
                  </div>
                  <div className="text-xs font-semibold">{step}</div>
                </div>
                {i < flow.length - 1 && <ChevronRight className="size-6 text-kairos-blue/60 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
      <SpeakerNotes n={5} />
    </SlideShell>
  );
}

/* SLIDE 6 — Interactive Map */
function Slide6Map() {
  const [mode, setMode] = useState<"arrival" | "departure" | "transition">("arrival");
  const [service, setService] = useState<"7:00 AM" | "10:00 AM" | "1:00 PM">("10:00 AM");
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.35em] text-kairos-blue font-mono mb-1">CHAPTER 06</div>
          <h1 className="text-3xl font-bold">Interactive Campus Map</h1>
        </div>
        <div className="flex gap-2">
          {(["arrival", "departure", "transition"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition ${
                mode === m ? "bg-kairos-blue border-kairos-blue text-white" : "border-white/10 text-muted-foreground hover:border-kairos-blue/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 overflow-hidden bg-surface h-[calc(100vh-200px)]">
        <MapPanel service={service} onServiceChange={setService} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { l: "UH Campus", c: "text-kairos-blue" },
          { l: "TSU Campus", c: "text-kairos-gold" },
          { l: "Wheeler Church", c: "text-white" },
        ].map((z) => (
          <div key={z.l} className="p-3 rounded-lg border border-white/5 bg-surface/60 text-xs flex items-center gap-2">
            <MapPin className={`size-4 ${z.c}`} />{z.l}
          </div>
        ))}
      </div>
      <SpeakerNotes n={6} />
    </div>
  );
}

/* SLIDE 7 — Ingress */
function Slide7Ingress() {
  return (
    <SlideShell eyebrow="CHAPTER 07" title="Ingress Plan" subtitle="How Wheeler guests flow onto campus.">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-[500px] rounded-2xl border border-white/5 bg-surface overflow-hidden relative">
          <div className="absolute inset-0 map-grid" />
          <svg viewBox="0 0 800 500" className="absolute inset-0 w-full h-full">
            {/* streets */}
            <path d="M0,400 L800,400" stroke="rgba(255,255,255,0.1)" strokeWidth="40" />
            <path d="M400,0 L400,500" stroke="rgba(255,255,255,0.1)" strokeWidth="40" />
            {/* ingress arrows */}
            <path d="M50,400 L380,400 L380,180" stroke="#22c55e" strokeWidth="4" fill="none" className="flow-dash" />
            <path d="M750,400 L420,400 L420,180" stroke="#22c55e" strokeWidth="4" fill="none" className="flow-dash" />
            {/* church */}
            <rect x="340" y="140" width="120" height="80" rx="6" fill="#0062ff" fillOpacity="0.3" stroke="#0062ff" />
            <text x="400" y="185" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">CHURCH</text>
            {/* staff pins */}
            {[[200, 400], [600, 400], [400, 300]].map(([x, y], i) => (
              <g key={i}><circle cx={x} cy={y} r="10" fill="#d4af37" /><circle cx={x} cy={y} r="18" fill="none" stroke="#d4af37" strokeOpacity="0.4" /></g>
            ))}
          </svg>
          <div className="absolute top-3 left-3 flex gap-2 text-[10px] font-mono">
            <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/40">→ INGRESS ACTIVE</span>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { i: ArrowRightCircle, l: "Green Arrows", d: "Vehicles entering campus" },
            { i: Bus, l: "Shuttle Loading", d: "Dedicated pickup zones" },
            { i: ParkingCircle, l: "Parking Attendants", d: "Directing to open lots" },
            { i: Users, l: "Volunteer Positions", d: "Coordinated placements" },
            { i: MapPin, l: "Traffic Cones", d: "Lane channelization" },
          ].map((it) => (
            <div key={it.l} className="p-3 rounded-lg border border-white/5 bg-surface flex items-start gap-3">
              <it.i className="size-5 text-green-400 shrink-0 mt-0.5" />
              <div><div className="text-sm font-semibold">{it.l}</div><div className="text-xs text-muted-foreground">{it.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <SpeakerNotes n={7} />
    </SlideShell>
  );
}

/* SLIDE 8 — Egress */
function Slide8Egress() {
  return (
    <SlideShell eyebrow="CHAPTER 08" title="Egress Plan" subtitle="Post-service clearance with dual exit lanes and shuttle priority.">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-[500px] rounded-2xl border border-white/5 bg-surface overflow-hidden relative">
          <div className="absolute inset-0 map-grid" />
          <svg viewBox="0 0 800 500" className="absolute inset-0 w-full h-full">
            <path d="M0,400 L800,400" stroke="rgba(255,255,255,0.1)" strokeWidth="40" />
            <path d="M400,0 L400,500" stroke="rgba(255,255,255,0.1)" strokeWidth="40" />
            <rect x="340" y="140" width="120" height="80" rx="6" fill="#0062ff" fillOpacity="0.3" stroke="#0062ff" />
            <text x="400" y="185" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">CHURCH</text>
            {/* dual egress lanes */}
            <path d="M380,220 L380,400 L50,400" stroke="#ef4444" strokeWidth="4" fill="none" className="flow-dash" />
            <path d="M420,220 L420,400 L750,400" stroke="#ef4444" strokeWidth="4" fill="none" className="flow-dash" />
            {/* officers */}
            {[[200, 380], [600, 380], [400, 420]].map(([x, y], i) => (
              <g key={i}><circle cx={x} cy={y} r="10" fill="#0062ff" /><text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">P</text></g>
            ))}
          </svg>
          <div className="absolute top-3 left-3 flex gap-2 text-[10px] font-mono">
            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/40">← EGRESS ACTIVE</span>
            <span className="px-2 py-1 rounded bg-kairos-blue/20 text-kairos-blue border border-kairos-blue/40">DUAL LANE</span>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { l: "Dual Exit Lanes", d: "East & West simultaneous", v: "50% faster" },
            { l: "Traffic Officers", d: "HPD coordination", v: "3 positions" },
            { l: "Queue Management", d: "Rolling release", v: "< 15 min" },
            { l: "Shuttle Priority", d: "Reserved lane", v: "Continuous" },
          ].map((it) => (
            <div key={it.l} className="p-4 rounded-lg border border-white/5 bg-surface">
              <div className="flex justify-between items-baseline">
                <div className="text-sm font-semibold">{it.l}</div>
                <div className="text-xs font-mono text-kairos-gold">{it.v}</div>
              </div>
              <div className="text-xs text-muted-foreground">{it.d}</div>
            </div>
          ))}
        </div>
      </div>
      <SpeakerNotes n={8} />
    </SlideShell>
  );
}

/* SLIDE 9 — Parking */
function Slide9Parking() {
  const lots = [
    { id: "Main", capacity: 420, current: 312, sup: "M. Alvarez", staff: 4, fill: "18 min", overflow: "Auto → Lot B" },
    { id: "Overflow B", capacity: 280, current: 198, sup: "D. Freeman", staff: 3, fill: "22 min", overflow: "Shuttle Lot" },
    { id: "Shuttle Lot", capacity: 350, current: 145, sup: "R. Hayes", staff: 5, fill: "N/A", overflow: "Street" },
  ];
  const [sel, setSel] = useState(0);
  const lot = lots[sel];
  return (
    <SlideShell eyebrow="CHAPTER 09" title="Parking Operations" subtitle="Click any lot to see live capacity, supervisor, and flow.">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {lots.map((l, i) => {
          const pct = Math.round((l.current / l.capacity) * 100);
          return (
            <button key={l.id} onClick={() => setSel(i)}
              className={`p-4 rounded-xl border text-left transition ${sel === i ? "border-kairos-blue bg-kairos-blue/10" : "border-white/5 bg-surface hover:border-white/20"}`}>
              <div className="flex justify-between items-center">
                <div className="font-semibold">{l.id}</div>
                <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 mt-3 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-kairos-blue to-kairos-gold" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground font-mono">{l.current} / {l.capacity}</div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Capacity" value={String(lot.capacity)} />
        <Stat label="Current Vehicles" value={String(lot.current)} accent="gold" />
        <Stat label="Supervisor" value={lot.sup} />
        <Stat label="Parking Staff" value={String(lot.staff)} />
        <Stat label="Est. Fill Time" value={lot.fill} />
        <Stat label="Overflow Path" value={lot.overflow} />
        <div className="col-span-2 p-5 rounded-xl border border-kairos-blue/30 bg-kairos-blue/5">
          <div className="text-[10px] tracking-widest text-kairos-blue mb-2">GUEST FLOW</div>
          <div className="text-sm">Arrivals routed via primary entrance → attendant hand-off → assigned row. Real-time redirect when {'>'}85% full.</div>
        </div>
      </div>
      <SpeakerNotes n={9} />
    </SlideShell>
  );
}

/* SLIDE 10 — Shuttle */
function ShuttleStatusIndicators({ s }: { s: { status: string; trips: number } }) {
  const available = s.status === "Loading" || s.status === "Staging";
  const enRoute = s.status === "Moving";
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition ${available ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
        <span className={`size-1.5 rounded-full ${available ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
        Available
      </span>
      <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition ${enRoute ? "bg-kairos-blue/15 border-kairos-blue/40 text-kairos-blue" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
        <span className={`size-1.5 rounded-full ${enRoute ? "bg-kairos-blue animate-pulse" : "bg-white/30"}`} />
        En Route
      </span>
      <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border bg-kairos-gold/15 border-kairos-gold/40 text-kairos-gold">
        <CheckCircle2 className="size-3" />
        {s.trips} trips
      </span>
    </div>
  );
}

function Slide10Shuttle() {
  const live = useLiveOps();
  const shuttles = live.shuttles;
  const [fleet] = useFleetConfig();
  const activeLabel = `${fleet.shuttleCount} active shuttle${fleet.shuttleCount === 1 ? "" : "s"}, ${fleet.golfCartCount} golf cart${fleet.golfCartCount === 1 ? "" : "s"}`;
  return (
    <SlideShell eyebrow="CHAPTER 10" title="Shuttle Operations" subtitle="Live tracking of every shuttle in the cycle.">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Active Shuttles" value={activeLabel} />
        <Stat label="Avg Wait Time" value={formatCycle(live.avgWaitSec)} sub="Target < 5:00" accent="gold" />
        <Stat label="Avg Cycle Time" value={`${live.avgShuttleCycleMin.toFixed(1)} min`} />
        <Stat label="Passengers / Hour" value={String(live.passengersPerHour)} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-surface p-4 h-[400px] relative overflow-hidden">
          <div className="text-[10px] tracking-widest text-muted-foreground mb-2">LIVE ROUTE</div>
          <div className="absolute inset-0 mt-10 map-grid opacity-40" />
          <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
            <path d="M50,50 Q200,80 350,60 Q380,150 350,240 Q200,270 50,240 Q30,150 50,50 Z"
              fill="none" stroke="#0062ff" strokeWidth="3" strokeOpacity="0.6" className="flow-dash" />
            {[[50, 50], [350, 60], [350, 240], [50, 240]].map(([x, y], i) => (
              <g key={i}><circle cx={x} cy={y} r="8" fill="#d4af37" /><circle cx={x} cy={y} r="14" fill="none" stroke="#d4af37" strokeOpacity="0.4" /></g>
            ))}
            <g><rect x="180" y="60" width="24" height="14" rx="2" fill="#0062ff" /><text x="192" y="70" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">S1</text></g>
          </svg>
        </div>
        <div className="space-y-2">
          {shuttles.map((s) => (
            <div key={s.id} className="p-3 rounded-lg border border-white/5 bg-surface">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-kairos-blue/20 border border-kairos-blue/40 grid place-items-center">
                  <Bus className="size-5 text-kairos-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{s.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-muted-foreground">{s.status}</span>
                    {s.type === "golf-cart" && <span className="text-[10px] px-2 py-0.5 rounded bg-kairos-gold/15 border border-kairos-gold/30 text-kairos-gold">Golf Cart</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{s.loc}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">PAX</div>
                  <div className="font-mono font-bold">{s.pax}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">CYCLE</div>
                  <div className="font-mono font-bold text-kairos-gold">{formatCycle(s.cycleSec)}</div>
                </div>
              </div>
              <ShuttleStatusIndicators s={s} />
            </div>
          ))}
        </div>
      </div>
      <SpeakerNotes n={10} />
    </SlideShell>
  );
}

/* SLIDE 11 — First Touch */
function Slide11FirstTouch() {
  return (
    <SlideShell eyebrow="CHAPTER 11" title="First Touch Partnership" subtitle="Kairos professionals + Wheeler ministry volunteers — one team, complementary roles.">
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-kairos-blue/30 bg-gradient-to-b from-kairos-blue/10 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-xl bg-kairos-blue/20 grid place-items-center"><ShieldCheck className="size-6 text-kairos-blue" /></div>
            <div><div className="text-[10px] tracking-widest text-kairos-blue">PROFESSIONAL</div><div className="text-xl font-bold">Kairos</div></div>
          </div>
          <ul className="space-y-2 text-sm">
            {["Traffic control & flagging", "Vehicle operations & shuttles", "Parking lot supervision", "Command & communications", "Incident response", "Reporting & analytics"].map((x) => (
              <li key={x} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-kairos-blue" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="p-6 rounded-2xl border border-kairos-gold/30 bg-gradient-to-b from-kairos-gold/10 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-xl bg-kairos-gold/20 grid place-items-center"><HeartHandshake className="size-6 text-kairos-gold" /></div>
            <div><div className="text-[10px] tracking-widest text-kairos-gold">MINISTRY</div><div className="text-xl font-bold">First Touch</div></div>
          </div>
          <ul className="space-y-2 text-sm">
            {["Guest greeting & welcome", "Wayfinding & hospitality", "Prayer & pastoral moments", "New guest connection", "Accessibility support", "Cultural touch of Wheeler"].map((x) => (
              <li key={x} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-kairos-gold" />{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 p-5 rounded-xl border border-white/10 bg-surface flex items-center justify-center gap-4 text-sm">
        <span className="text-kairos-blue font-semibold">Kairos handles the operation</span>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span>so volunteers can focus on ministry</span>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="text-kairos-gold font-semibold">First Touch never leaves the guest</span>
      </div>
      <SpeakerNotes n={11} />
    </SlideShell>
  );
}

/* SLIDE 12 — Command Center */
function Slide12Command() {
  const live = useLiveOps();
  const modules = [
    { i: MonitorPlay, l: "Supervisor Dashboard" }, { i: MapIcon, l: "Vehicle Tracking" },
    { i: AlertTriangle, l: "Incident Mgmt" }, { i: Radio, l: "Communications" },
    { i: Gauge, l: "Live KPIs" }, { i: MapPin, l: "Maps" },
    { i: Clock, l: "Clock In / Out" }, { i: Users, l: "Staffing Board" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 12" title="Operations Command Center" subtitle="Kairos brings more than transportation — we bring operational management.">
      <div className="rounded-2xl border border-kairos-blue/30 bg-gradient-to-br from-kairos-blue/5 to-transparent p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-green-400">COMMAND ONLINE</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">SUNDAY · 10:00 AM SERVICE</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {modules.map((m) => (
            <div key={m.l} className="p-4 rounded-xl border border-white/5 bg-surface hover:border-kairos-blue/40 transition text-center fade-in-up">
              <m.i className="size-6 mx-auto text-kairos-blue mb-2" />
              <div className="text-xs font-semibold">{m.l}</div>
              <div className="text-[10px] text-green-400 font-mono mt-1">● LIVE</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-4 gap-4">
          <Stat label="Personnel On Scene" value={String(live.activePersonnel)} />
          <Stat label="Vehicles Active" value={String(live.vehiclesActive)} />
          <Stat label="Incidents Open" value={String(live.incidentsOpen)} accent="gold" />
          <Stat label="System Uptime" value={`${live.systemUptimePct.toFixed(1)}%`} />
        </div>
      </div>
      <SpeakerNotes n={12} />
    </SlideShell>
  );
}

/* SLIDE 13 — KPIs */
function Slide13KPI() {
  const live = useLiveOps();
  const kpis = [
    { l: "Avg Wait Time", v: formatCycle(live.avgWaitSec), t: "< 5:00", ok: live.avgWaitSec < 300 },
    { l: "Traffic Clearance", v: `${live.trafficClearanceMin} min`, t: "< 15 min", ok: live.trafficClearanceMin < 15 },
    { l: "Guest Satisfaction", v: `${live.guestSatisfaction.toFixed(1)}/5`, t: "> 4.5", ok: live.guestSatisfaction > 4.5 },
    { l: "Parking Fill Rate", v: `${live.parkingFillPct.toFixed(0)}%`, t: "80-90%", ok: live.parkingFillPct >= 80 && live.parkingFillPct <= 95 },
    { l: "Shuttle Cycle", v: `${live.avgShuttleCycleMin.toFixed(1)} min`, t: "< 14:00", ok: live.avgShuttleCycleMin < 14 },
    { l: "Incident Rate", v: `${live.incidentRatePct.toFixed(2)}%`, t: "< 0.5%", ok: live.incidentRatePct < 0.5 },
    { l: "Vehicle Readiness", v: `${live.vehicleReadinessPct}%`, t: "100%", ok: live.vehicleReadinessPct === 100 },
    { l: "Staff Attendance", v: `${live.staffAttendancePct.toFixed(1)}%`, t: "> 98%", ok: live.staffAttendancePct > 98 },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 13" title="Performance KPIs" subtitle="Every commitment in the proposal, measured in real time.">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={k.l} className="p-5 rounded-xl border border-white/5 bg-surface fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between items-start">
              <div className="text-[10px] tracking-widest text-muted-foreground">{k.l}</div>
              <TrendingUp className="size-3 text-green-400" />
            </div>
            <div className="text-3xl font-bold font-mono mt-2 text-white">{k.v}</div>
            <div className="text-[10px] text-muted-foreground mt-1">TARGET {k.t}</div>
            <div className="h-1 mt-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-kairos-blue" style={{ width: `${70 + (i * 3) % 30}%` }} />
            </div>
          </div>
        ))}
      </div>
      <SpeakerNotes n={13} />
    </SlideShell>
  );
}

/* SLIDE 14 — Tech */
function Slide14Tech() {
  const features = [
    { i: Users, l: "Employee App" }, { i: MonitorPlay, l: "Leadership Dashboard" },
    { i: FileText, l: "Reports" }, { i: Camera, l: "Photos" },
    { i: Radio, l: "Messaging" }, { i: MapPin, l: "GPS Tracking" },
    { i: Clock, l: "Time Clock" }, { i: AlertTriangle, l: "Incident Reports" },
    { i: FileText, l: "Weekly Reports" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 14" title="Technology Platform" subtitle="The Kairos Command app — Wheeler's communication platform.">
      <div className="grid grid-cols-3 gap-8">
        <div className="rounded-[2rem] border-4 border-white/10 bg-bg-deep p-3 aspect-[9/19] max-w-[280px] mx-auto shadow-[0_0_60px_rgba(0,98,255,0.2)]">
          <div className="h-full rounded-[1.5rem] bg-gradient-to-b from-kairos-blue/20 to-surface p-4 flex flex-col">
            <div className="text-[10px] font-mono text-kairos-blue">KAIROS COMMAND</div>
            <div className="text-lg font-bold mt-1">Good Morning</div>
            <div className="text-xs text-muted-foreground">Sunday · 10AM Service</div>
            <div className="mt-4 p-3 rounded-lg bg-white/5 text-xs"><Clock className="size-3 inline mr-1" />Clocked in 06:42</div>
            <div className="mt-2 p-3 rounded-lg bg-kairos-blue/10 border border-kairos-blue/30 text-xs"><Radio className="size-3 inline mr-1" />2 new messages</div>
            <div className="mt-2 p-3 rounded-lg bg-white/5 text-xs"><MapPin className="size-3 inline mr-1" />Post: Main Lot Row 3</div>
            <div className="mt-auto grid grid-cols-4 gap-1 text-center">
              {[Home, Radio, Camera, Users].map((I, i) => <div key={i} className="p-2 rounded bg-white/5"><I className="size-4 mx-auto" /></div>)}
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-3 gap-3">
          {features.map((f) => (
            <div key={f.l} className="p-4 rounded-xl border border-white/5 bg-surface flex items-center gap-3">
              <f.i className="size-5 text-kairos-blue" /><span className="text-sm font-semibold">{f.l}</span>
            </div>
          ))}
          <div className="col-span-3 p-4 rounded-xl border border-kairos-gold/30 bg-kairos-gold/5 text-sm">
            Every employee, every shift, every incident, every photo — one platform Wheeler leadership can access live.
          </div>
        </div>
      </div>
      <SpeakerNotes n={14} />
    </SlideShell>
  );
}

/* SLIDE 15 — Staffing */
function Slide15Staffing() {
  return (
    <SlideShell eyebrow="CHAPTER 15" title="Staffing" subtitle="Organized command structure with clear ownership.">
      <div className="flex flex-col items-center gap-4">
        <OrgNode title="Operations Supervisor" sub="On-scene commander" accent="blue" />
        <div className="w-px h-6 bg-white/20" />
        <OrgNode title="Assistant Supervisor" sub="Deputy · Backup" accent="blue" />
        <div className="w-px h-6 bg-white/20" />
        <div className="grid grid-cols-5 gap-4 w-full max-w-5xl">
          {[
            { t: "Drivers", n: 4 }, { t: "Parking", n: 8 },
            { t: "Golf Cart", n: 2 }, { t: "Volunteers", n: 12 }, { t: "HPD", n: 3 },
          ].map((r) => (
            <div key={r.t} className="p-4 rounded-xl border border-white/5 bg-surface text-center">
              <div className="text-3xl font-bold font-mono text-kairos-gold">{r.n}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{r.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <Stat label="Total Personnel" value="29" />
        <Stat label="Locations Covered" value="7" />
        <Stat label="Coverage Window" value="6 hrs" accent="gold" />
      </div>
      <SpeakerNotes n={15} />
    </SlideShell>
  );
}
function OrgNode({ title, sub, accent }: { title: string; sub: string; accent: "blue" | "gold" }) {
  return (
    <div className={`px-6 py-3 rounded-xl border ${accent === "blue" ? "border-kairos-blue/40 bg-kairos-blue/10" : "border-kairos-gold/40 bg-kairos-gold/10"} text-center`}>
      <div className="font-bold">{title}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

/* SLIDE 16 — Fleet */
function Slide16Fleet() {
  const fleet = [
    { i: Bus, t: "Shuttles", n: 4, spec: "24-passenger · ADA" },
    { i: Zap, t: "Golf Carts", n: 2, spec: "6-passenger campus" },
    { i: Truck, t: "Church Vehicles", n: 3, spec: "Supported operations" },
    { i: Circle, t: "Traffic Cones", n: 120, spec: "28in reflective" },
    { i: ShieldCheck, t: "Safety Equipment", n: 45, spec: "Vests · lights · radios" },
    { i: Radio, t: "Comms Radios", n: 30, spec: "Encrypted digital" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 16" title="Vehicle Fleet & Equipment" subtitle="Every asset assigned, inspected, and ready before Sunday.">
      <div className="grid grid-cols-3 gap-4">
        {fleet.map((f) => (
          <div key={f.t} className="p-5 rounded-xl border border-white/5 bg-surface fade-in-up">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-kairos-blue/15 border border-kairos-blue/30 grid place-items-center"><f.i className="size-6 text-kairos-blue" /></div>
              <div>
                <div className="text-3xl font-bold font-mono">{f.n}</div>
                <div className="text-sm font-semibold">{f.t}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">{f.spec}</div>
          </div>
        ))}
      </div>
      <SpeakerNotes n={16} />
    </SlideShell>
  );
}

/* SLIDE 17 — Safety */
function Slide17Safety() {
  const items = [
    { i: Award, l: "Training", d: "40hr onboarding + monthly" },
    { i: ShieldCheck, l: "Drug Testing", d: "Pre-employment + random" },
    { i: BadgeCheck, l: "Background Checks", d: "7-year criminal + MVR" },
    { i: AlertTriangle, l: "Emergency Response", d: "Documented protocols" },
    { i: HeartHandshake, l: "ADA Compliance", d: "Certified accessibility" },
    { i: FileText, l: "Insurance", d: "$5M general liability" },
    { i: Activity, l: "Incident Reporting", d: "Real-time via app" },
    { i: Eye, l: "Weather Plan", d: "Severe weather triggers" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 17" title="Safety & Compliance" subtitle="The framework that protects Wheeler, its guests, and its people.">
      <div className="grid grid-cols-4 gap-4">
        {items.map((it) => <IconTile key={it.l} icon={it.i} title={it.l} desc={it.d} />)}
      </div>
      <SpeakerNotes n={17} />
    </SlideShell>
  );
}

/* SLIDE 18 — Timeline */
function Slide18Timeline() {
  const steps = [
    { t: "Award", d: "Contract execution" },
    { t: "Observation", d: "Ride-along + shadow" },
    { t: "Planning", d: "Ops plan & staffing" },
    { t: "Training", d: "Team onboarding" },
    { t: "Soft Launch", d: "First Sunday supported" },
    { t: "Go Live", d: "Full ownership" },
    { t: "Continuous", d: "Monthly reviews" },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 18" title="Implementation Timeline" subtitle="From award to full operations in 45 days.">
      <div className="relative">
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-kairos-blue via-kairos-gold to-kairos-blue" />
        <div className="grid grid-cols-7 gap-2 relative">
          {steps.map((s, i) => (
            <div key={s.t} className="text-center fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="size-16 mx-auto rounded-full bg-surface border-2 border-kairos-blue grid place-items-center relative z-10 pulse-blue">
                <span className="font-mono font-bold text-kairos-blue">{i + 1}</span>
              </div>
              <div className="mt-3 font-semibold text-sm">{s.t}</div>
              <div className="text-xs text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4">
        <Stat label="Days to Launch" value="45" accent="gold" />
        <Stat label="Training Hours" value="40+" />
        <Stat label="Ongoing Reviews" value="Monthly" />
      </div>
      <SpeakerNotes n={18} />
    </SlideShell>
  );
}

/* SLIDE 19 — Pricing */
function Slide19Pricing() {
  const cards = [
    { t: "Sunday Operations", p: "$7,150", per: "per Sunday", items: ["3 services covered", "Full staffing", "Command center", "Live reporting"], featured: true },
    { t: "Wednesday Services", p: "TBD", per: "hourly rate", items: ["Hourly rate for staff and personnel", "Hourly rate for vehicles"] },
    { t: "Special Events", p: "Custom", per: "quoted per event", items: ["Conferences", "Weddings", "Community events", "Holiday services"] },
  ];
  return (
    <SlideShell eyebrow="CHAPTER 19" title="Investment" subtitle="Transparent, simple pricing. No hidden fees.">
      <div className="grid grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.t} className={`p-6 rounded-2xl border ${c.featured ? "border-kairos-gold/50 bg-gradient-to-b from-kairos-gold/10 to-transparent" : "border-white/10 bg-surface"}`}>
            {c.featured && <div className="text-[10px] font-mono tracking-widest text-kairos-gold mb-2">RECOMMENDED</div>}
            <div className="text-lg font-semibold">{c.t}</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono">{c.p}</span>
              <span className="text-xs text-muted-foreground">{c.per}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {c.items.map((x) => <li key={x} className="flex items-center gap-2"><CheckCircle2 className={`size-4 ${c.featured ? "text-kairos-gold" : "text-kairos-blue"}`} />{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-3 justify-center">
        <button className="px-6 py-3 rounded-lg bg-kairos-blue text-white font-semibold flex items-center gap-2"><FileText className="size-4" /> Download Proposal</button>
        <button className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 font-semibold flex items-center gap-2"><Eye className="size-4" /> View Details</button>
      </div>
      <SpeakerNotes n={19} />
    </SlideShell>
  );
}

/* SLIDE 20 — Why Kairos */
function Slide20Why() {
  const rows = [
    "Already on Campus", "Knows Wheeler", "Integrated Technology", "Command Center",
    "Live Reporting", "First Touch Partnership", "Operations Experience", "Continuous Improvement", "Professional Staff",
  ];
  return (
    <SlideShell eyebrow="CHAPTER 20" title="Why Kairos" subtitle="The difference is measurable.">
      <div className="rounded-2xl border border-white/5 bg-surface overflow-hidden">
        <div className="grid grid-cols-3 border-b border-white/5">
          <div className="p-4 text-xs font-mono tracking-widest text-muted-foreground">CAPABILITY</div>
          <div className="p-4 text-center bg-kairos-blue/10 border-x border-kairos-blue/30">
            <div className="text-[10px] tracking-widest text-kairos-blue">KAIROS</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-[10px] tracking-widest text-muted-foreground">OTHERS</div>
          </div>
        </div>
        {rows.map((r, i) => (
          <div key={r} className={`grid grid-cols-3 border-b border-white/5 ${i % 2 ? "bg-white/[0.02]" : ""}`}>
            <div className="p-3 text-sm font-semibold">{r}</div>
            <div className="p-3 text-center bg-kairos-blue/5 border-x border-kairos-blue/20"><CheckCircle2 className="size-5 text-green-400 mx-auto" /></div>
            <div className="p-3 text-center"><Circle className="size-5 text-muted-foreground/40 mx-auto" /></div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center p-8 rounded-2xl border border-kairos-gold/30 bg-gradient-to-br from-kairos-gold/10 to-transparent">
        <div className="text-2xl md:text-3xl font-bold">"We don't simply transport guests.</div>
        <div className="text-2xl md:text-3xl font-bold text-kairos-gold italic mt-1">We create an experience."</div>
      </div>
      <SpeakerNotes n={20} />
    </SlideShell>
  );
}

/* SLIDE 21 — Questions */
function Slide21Questions() {
  return (
    <div className="pb-10">
      <div className="relative min-h-[80vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 map-grid opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15),transparent_70%)]" />
        <div className="relative text-center px-6 max-w-3xl fade-in-up">
          <div className="text-[10px] tracking-[0.4em] text-kairos-gold font-mono mb-4">CHAPTER 21</div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-glow-blue">Thank You.</h1>
          <div className="mt-6 text-xl text-muted-foreground">Questions & Discussion</div>
          <div className="mt-8 p-6 rounded-2xl border border-kairos-gold/30 bg-gradient-to-br from-kairos-gold/10 to-transparent">
            <div className="text-lg md:text-xl italic text-white leading-relaxed">
              "Moving People With Excellence. Serving Wheeler Avenue Baptist Church with professionalism, hospitality, safety, and operational excellence."
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-sm tracking-[0.3em] text-muted-foreground">KAIROS SECURITY</div>
            <div className="text-lg mt-1">Professional Transportation Operations Partner</div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-[10px] text-muted-foreground tracking-widest">CONTACT</div><div className="mt-1">operations@kairossecurity.com</div></div>
              <div><div className="text-[10px] text-muted-foreground tracking-widest">PHONE</div><div className="mt-1">(713) 555-0100</div></div>
              <div><div className="text-[10px] text-muted-foreground tracking-widest">HOUSTON, TX</div><div className="mt-1">HUB · MBE Certified</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-8 md:px-12 max-w-[1600px] mx-auto">
        <SpeakerNotes n={21} />
      </div>
    </div>
  );
}
