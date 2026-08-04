import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

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

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m! - 1]} ${y}`;
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const touchStartX = useRef<number | null>(null);

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
      if (delay < -60_000) continue;
      if (delay > 24 * 3600_000) continue;
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

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());
    return events
      .filter((e) => e.date >= todayKey)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
      .slice(0, 6);
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
  const todayDay = today.getDate();

  const closeDrawer = () => {
    setDrawerClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setDrawerClosing(false);
    }, 250);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].screenX;
    const delta = endX - touchStartX.current;
    if (delta < -50) shift(1);
    else if (delta > 50) shift(-1);
    touchStartX.current = null;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-lg text-primary-foreground">
          م
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold text-foreground">مِيعاد</h2>
          <p className="truncate text-xs text-muted-foreground">تقويمك الذكي</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-xs text-muted-foreground">اليوم</p>
        <p className="mt-1 font-display text-lg font-semibold text-foreground">
          {formatDateLabel(todayKey)}
        </p>
        <button
          onClick={() => {
            openDay(todayDay);
            closeDrawer();
          }}
          className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          إضافة موعد اليوم
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-3 font-display text-sm font-semibold text-foreground">المواعيد القادمة</h3>
        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
          {upcomingEvents.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-background p-4 text-center text-sm text-muted-foreground">
              لا توجد مواعيد قادمة
            </p>
          )}
          {upcomingEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => {
                const [y, m, d] = ev.date.split("-").map(Number);
                setYear(y!);
                setMonth(m! - 1);
                setSelected(ev.date);
                closeDrawer();
              }}
              className="w-full rounded-xl border border-border bg-background p-3 text-right transition-colors hover:bg-accent"
            >
              <p className="truncate text-sm font-medium text-foreground">{ev.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateLabel(ev.date)} • {ev.time}
              </p>
            </button>
          ))}
        </div>
      </div>

      <footer className="text-center text-xs text-muted-foreground">
        صُنع بواسطة فارس
      </footer>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="القائمة"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
          >
            ☰
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate font-display text-lg font-bold text-foreground">مِيعاد</h1>
            <p className="truncate text-xs text-muted-foreground">تقويمك الذكي</p>
          </div>
          <button
            onClick={() => openDay(todayDay)}
            aria-label="إضافة موعد اليوم"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-lg text-primary-foreground transition-opacity hover:opacity-90"
          >
            +
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-57px)] sm:min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-l border-border bg-card p-5 sm:flex sm:flex-col">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {(mobileMenuOpen || drawerClosing) && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <div
              className={`absolute right-0 top-0 h-full w-4/5 max-w-xs border-l border-border bg-card p-5 shadow-soft ${
                drawerClosing ? "slide-out-right" : "slide-in-right"
              }`}
            >
              <button
                onClick={closeDrawer}
                aria-label="إغلاق"
                className="absolute left-4 top-4 rounded-lg px-2 py-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Desktop header */}
          <header className="mb-6 hidden grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:grid">
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
                ›
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
                ‹
              </button>
            </div>
          </header>

          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
            {/* Sticky calendar header */}
            <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-card px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 truncate font-display text-lg font-semibold text-foreground sm:text-xl">
                  {MONTHS[month]} {year}
                </h2>
                <div className="flex shrink-0 items-center gap-2 sm:hidden">
                  <button
                    onClick={() => shift(-1)}
                    aria-label="الشهر السابق"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-accent"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => {
                      setYear(today.getFullYear());
                      setMonth(today.getMonth());
                    }}
                    className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                  >
                    اليوم
                  </button>
                  <button
                    onClick={() => shift(1)}
                    aria-label="الشهر التالي"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-accent"
                  >
                    ‹
                  </button>
                </div>
              </div>
            </div>

            <div
              className="month-fade grid grid-cols-7 gap-1 sm:gap-2"
              key={`${year}-${month}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
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
                    className={`flex min-h-20 flex-col items-start gap-1 rounded-2xl border p-2 text-right transition-all active:scale-95 sm:min-h-28 sm:p-3 ${
                      isToday
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold sm:text-base ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {day}
                    </span>
                    <span className="flex w-full flex-1 flex-col gap-1 overflow-hidden">
                      {list.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className="flex w-full items-center gap-1 truncate rounded-md bg-secondary px-1.5 py-1 text-[10px] text-secondary-foreground sm:text-xs"
                        >
                          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
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
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm fade-in sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-soft scale-in sm:rounded-3xl"
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
                <div className="rounded-xl border border-dashed border-border bg-background p-5 text-center">
                  <p className="text-sm font-medium text-foreground">لا توجد مواعيد لهذا اليوم</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    أضف موعدك الأول بالأعلى
                  </p>
                </div>
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
