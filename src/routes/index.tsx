import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مِيعاد | تقويم ذكي لإدارة مواعيدك" },
      {
        name: "description",
        content:
          "مِيعاد تطبيق تقويم ذكي بالعربية لإضافة المواعيد والأحداث وتفعيل التنبيهات وحفظها تلقائياً في متصفحك.",
      },
      { property: "og:title", content: "مِيعاد | تقويم ذكي لإدارة مواعيدك" },
      {
        property: "og:description",
        content: "مِيعاد تطبيق تقويم ذكي بالعربية لإضافة المواعيد والأحداث وتفعيل التنبيهات وحفظها تلقائياً في متصفحك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type EventItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string;
  notify: boolean;
  remind?: number; // دقائق قبل الموعد
};

const STORAGE_KEY = "mee3ad-events";
const FIRED_KEY = "mee3ad-fired";
const REMIND_OPTIONS = [0, 5, 10, 15, 30, 60, 120];


const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function Index() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [notify, setNotify] = useState(true);
  const [remind, setRemind] = useState(10);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");


  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, loaded]);

  // حالة إذن التنبيهات
  useEffect(() => {
    if (typeof Notification === "undefined") setPermission("unsupported");
    else setPermission(Notification.permission);
  }, []);

  const askPermission = async () => {
    if (typeof Notification === "undefined") return setPermission("unsupported");
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      /* ignore */
    }
  };

  // جدولة التذكيرات قبل موعد كل فعالية مفعّلة التنبيه
  useEffect(() => {
    if (!loaded || typeof Notification === "undefined" || permission !== "granted") return;

    let fired: string[] = [];
    try {
      fired = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]");
    } catch {
      /* ignore */
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();

    const fire = (ev: EventItem, minutes: number) => {
      try {
        new Notification("مِيعاد", {
          body:
            minutes > 0
              ? `${ev.title} بعد ${minutes} دقيقة (${ev.time})`
              : `${ev.title} الآن (${ev.time})`,
          tag: ev.id,
        });
      } catch {
        /* ignore */
      }
      fired.push(ev.id);
      try {
        localStorage.setItem(FIRED_KEY, JSON.stringify(fired.slice(-200)));
      } catch {
        /* ignore */
      }
    };

    for (const ev of events) {
      if (!ev.notify || fired.includes(ev.id)) continue;
      const [h, m] = ev.time.split(":").map(Number);
      const [yy, mm, dd] = ev.date.split("-").map(Number);
      const at = new Date(yy!, mm! - 1, dd!, h ?? 0, m ?? 0).getTime();
      const minutes = ev.remind ?? 10;
      const delay = at - minutes * 60_000 - now;
      if (delay < -60_000) continue; // فات وقته
      if (delay > 24 * 3600_000) continue; // بعيد، سيُجدول لاحقاً
      timers.push(setTimeout(() => fire(ev, minutes), Math.max(delay, 0)));
    }

    return () => timers.forEach(clearTimeout);
  }, [events, loaded, permission]);


  const byDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of events) (map[e.date] ??= []).push(e);
    for (const k of Object.keys(map)) map[k]!.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [events]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const openDay = (day: number) => {
    setSelected(key(year, month, day));
    setTitle("");
    setTime("09:00");
    setNotify(true);
    setRemind(10);
  };

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !title.trim()) return;
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date: selected, title: title.trim(), time, notify, remind },
    ]);
    if (notify && permission !== "granted") void askPermission();
    setTitle("");

  };

  const remove = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedEvents = selected ? (byDate[selected] ?? []) : [];

  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-8 font-body sm:py-12">
      <main className="mx-auto w-full max-w-5xl">
        <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-bold text-foreground sm:text-4xl">
              مِيعاد
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              تقويمك الذكي لتنظيم المواعيد والأحداث
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => shift(-1)}
              aria-label="الشهر السابق"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              ‹
            </button>
            <button
              onClick={() => {
                setYear(today.getFullYear());
                setMonth(today.getMonth());
              }}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              اليوم
            </button>
            <button
              onClick={() => shift(1)}
              aria-label="الشهر التالي"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              ›
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
          <h2 className="mb-4 text-center font-display text-xl font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="truncate py-2 text-center text-[11px] font-medium text-muted-foreground sm:text-sm"
              >
                {d}
              </div>
            ))}

            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const k = key(year, month, day);
              const list = byDate[k] ?? [];
              const isToday = k === todayKey;
              return (
                <button
                  key={k}
                  onClick={() => openDay(day)}
                  className={`flex min-h-16 flex-col items-start gap-1 rounded-xl border p-1.5 text-right transition-colors sm:min-h-24 sm:p-2 ${
                    isToday
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold sm:text-sm ${isToday ? "text-primary" : "text-foreground"}`}
                  >
                    {day}
                  </span>
                  <span className="flex w-full flex-col gap-0.5">
                    {list.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className="w-full truncate rounded-md bg-secondary px-1 py-0.5 text-[10px] text-secondary-foreground sm:text-xs"
                      >
                        {ev.time} {ev.title}
                      </span>
                    ))}
                    {list.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{list.length - 2} أخرى
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-soft sm:rounded-3xl"
          >
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h3 className="truncate font-display text-lg font-semibold text-foreground">
                مواعيد {selected.split("-").reverse().join("/")}
              </h3>
              <button
                onClick={() => setSelected(null)}
                aria-label="إغلاق"
                className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addEvent} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground" htmlFor="title">
                  عنوان الموعد
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: موعد الطبيب"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground" htmlFor="time">
                  الوقت
                </label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                تفعيل التنبيهات
              </label>
              {notify && (
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground" htmlFor="remind">
                    التذكير قبل الموعد
                  </label>
                  <select
                    id="remind"
                    value={remind}
                    onChange={(e) => setRemind(Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                  >
                    {REMIND_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? "في وقت الموعد" : `قبل ${m} دقيقة`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {notify && permission !== "granted" && (
                <div className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                  {permission === "unsupported" ? (
                    "متصفحك لا يدعم تنبيهات الويب."
                  ) : permission === "denied" ? (
                    "التنبيهات محظورة في إعدادات المتصفح لهذا الموقع."
                  ) : (
                    <button
                      type="button"
                      onClick={askPermission}
                      className="font-medium text-primary underline"
                    >
                      السماح بالتنبيهات في المتصفح
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                إضافة الموعد
              </button>
            </form>

            <div className="mt-5 space-y-2">
              {selectedEvents.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">لا توجد مواعيد لهذا اليوم</p>
              )}
              {selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.time}
                      {ev.notify
                        ? (ev.remind ?? 10) > 0
                          ? ` • تذكير قبل ${ev.remind ?? 10} دقيقة`
                          : " • تذكير في الوقت"
                        : ""}
                    </p>

                  </div>
                  <button
                    onClick={() => remove(ev.id)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
