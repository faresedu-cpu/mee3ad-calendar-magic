import { useEffect, useRef, useState } from "react";
import { Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";

export type FocusMode = { id: string; label: string; focus: number; brk: number };

export const FOCUS_MODES: FocusMode[] = [
  { id: "classic", label: "٢٥ / ٥", focus: 25, brk: 5 },
  { id: "deep", label: "٥٠ / ١٠", focus: 50, brk: 10 },
  { id: "sprint", label: "١٥ / ٣", focus: 15, brk: 3 },
];

function chime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  } catch {
    /* ignore */
  }
}

export function FocusTimer({
  onComplete,
  sound = true,
  expanded = false,
}: {
  onComplete?: (minutes: number) => void;
  sound?: boolean;
  expanded?: boolean;
}) {
  const [mode, setMode] = useState<FocusMode>(FOCUS_MODES[0]!);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(FOCUS_MODES[0]!.focus * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = (phase === "focus" ? mode.focus : mode.brk) * 60;

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setRunning(false);
        if (sound) chime();
        if (phase === "focus") {
          onComplete?.(mode.focus);
          setPhase("break");
          return mode.brk * 60;
        }
        setPhase("focus");
        return mode.focus * 60;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, phase, mode, sound, onComplete]);

  const pick = (m: FocusMode) => {
    setRunning(false);
    setMode(m);
    setPhase("focus");
    setLeft(m.focus * 60);
  };

  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const ring = phase === "focus" ? "var(--primary)" : "var(--cat-social)";

  return (
    <div className="rounded-3xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cat-study/12 text-cat-study">
          {phase === "focus" ? <Timer size={17} /> : <Coffee size={17} />}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-bold text-foreground">
            {phase === "focus" ? "جلسة تركيز" : "استراحة قصيرة"}
          </h3>
          <p className="truncate text-[11px] text-muted-foreground">
            نمط بومودورو {mode.focus} دقيقة تركيز / {mode.brk} دقائق راحة
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-4 ${expanded ? "flex-col sm:flex-row" : ""}`}>
        <div
          className={`grid shrink-0 place-items-center rounded-full ${expanded ? "h-36 w-36" : "h-20 w-20"}`}
          style={{ background: `conic-gradient(${ring} ${pct * 3.6}deg, var(--secondary) 0deg)` }}
        >
          <span
            className={`grid place-items-center rounded-full bg-card font-display font-extrabold text-foreground ${
              expanded ? "h-28 w-28 text-3xl" : "h-16 w-16 text-base"
            }`}
          >
            <span dir="ltr">
              {mm}:{ss}
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1 self-stretch">
          <div className="flex gap-1.5">
            {FOCUS_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pick(m)}
                className={`flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-colors ${
                  mode.id === m.id
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
              {running ? "إيقاف مؤقت" : "ابدأ التركيز"}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setPhase("focus");
                setLeft(mode.focus * 60);
              }}
              aria-label="إعادة"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
