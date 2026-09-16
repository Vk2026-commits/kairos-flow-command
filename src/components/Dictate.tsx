import { useEffect, useRef, useState } from "react";

// Push-to-talk dictation for long text boxes. Uses the browser's own speech
// recognition, so nothing is uploaded anywhere and no extra account is needed.
// Chrome, Edge and Safari support it; on anything else the button hides itself.

type Recognition = any;

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function Dictate({
  onText,
  label = "Push to talk",
  className = "",
}: {
  /** Called with each finished phrase; append it to your field value. */
  onText: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    const rec = getRecognition();
    setSupported(Boolean(rec));
    if (rec) rec.abort?.();
    return () => {
      stopRef.current = true;
      recRef.current?.abort?.();
    };
  }, []);

  const start = () => {
    if (listening) {
      stopRef.current = true;
      recRef.current?.stop?.();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    stopRef.current = false;
    setError(null);
    setHeard("");
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = String(result[0]?.transcript ?? "").trim();
        if (!text) continue;
        if (result.isFinal) onText(text);
        else interim = text;
      }
      setHeard(interim);
    };
    rec.onerror = (event: any) => {
      const code = String(event?.error ?? "");
      setError(
        code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone access was blocked. Allow the microphone for this site, then try again."
          : code === "no-speech"
            ? "Didn't catch that — try again."
            : "Dictation stopped unexpectedly.",
      );
      stopRef.current = true;
    };
    rec.onend = () => {
      setHeard("");
      // Browsers cut the stream off after a pause; keep going until told to stop.
      if (!stopRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through to stopping */
        }
      }
      setListening(false);
    };
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Dictation could not start.");
    }
  };

  if (!supported) return null;

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={start}
        aria-pressed={listening}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition ${
          listening
            ? "animate-pulse border-red-400/60 bg-red-500/20 text-red-200"
            : "border-kairos-gold/40 bg-white/5 text-kairos-gold hover:bg-white/10"
        }`}
        title="Speak instead of typing"
      >
        <span aria-hidden>{listening ? "■" : "🎙"}</span>
        {listening ? "Listening — tap to stop" : label}
      </button>
      {listening && heard && <span className="text-[10px] italic text-slate-400">{heard}…</span>}
      {error && <span className="text-[10px] text-red-300">{error}</span>}
    </span>
  );
}

/** Adds a spoken phrase to whatever is already in the box. */
export function appendSpoken(current: unknown, spoken: string): string {
  const base = String(current ?? "").replace(/\s+$/, "");
  if (!base) return spoken.charAt(0).toUpperCase() + spoken.slice(1);
  const glue = /[.!?]$/.test(base) ? " " : /[,;:]$/.test(base) ? " " : ". ";
  return base + glue + spoken.charAt(0).toUpperCase() + spoken.slice(1);
}
