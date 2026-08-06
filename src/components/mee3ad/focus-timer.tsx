import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

const PRESETS = [
  { label: "٢٥ د", minutes: 25 },
  { label: "١٥ د", minutes: 15 },
  { label: "٥ د", minutes: 5 },
];

export function FocusTimer() {
  const [total, setTotal] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  const pick = (m: number) => {
    setRunning(false);
    setTotal(m * 60);
    setLeft(m * 60);
  };

  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cat-study/12 text-cat-study">
          <Timer size={17} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-bold text-foreground">
            مؤقت التركيز والمذاكرة
          </h3>
          <p className="truncate text-[11px] text-muted-foreground">جلسة تركيز بأسلوب بومودورو</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--secondary) 0deg)`,
          }}
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-card font-display text-base font-extrabold text-foreground">
            <span dir="ltr">
              {mm}:{ss}
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => pick(p.minutes)}
                className={`flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-colors ${
                  total === p.minutes * 60
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {p.label}
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
                setLeft(total);
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
