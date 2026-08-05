import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CATEGORIES, getCategory, type CategoryId } from "@/lib/event-categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مِيعاد | تقويم ذكي لإدارة مواعيدك" },
      {
        name: "description",
        content:
          "مِيعاد تطبيق تقويم ذكي بالعربية لإضافة المواعيد والأحداث حسب نوعها مع تنبيهات وتذكيرات وحفظ تلقائي في متصفحك.",
      },
      { property: "og:title", content: "مِيعاد | تقويم ذكي لإدارة مواعيدك" },
      {
        property: "og:description",
        content:
          "مِيعاد تطبيق تقويم ذكي بالعربية لإضافة المواعيد والأحداث حسب نوعها مع تنبيهات وتذكيرات وحفظ تلقائي في متصفحك.",
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
  category?: CategoryId;
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
const DAYS_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m! - 1]} ${y}`;
}

/* ---------------- reusable design-system pieces ---------------- */

function CategoryBadge({ id, size = "md" }: { id?: CategoryId; size?: "sm" | "md" }) {
  const cat = getCategory(id);
  const Icon = cat.icon;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl ${cat.bg} ${cat.text} ${
        size === "sm" ? "h-9 w-9" : "h-11 w-11"
      }`}
    >
      <Icon size={size === "sm" ? 16 : 20} strokeWidth={2.2} />
    </span>
  );
}

function EventCard({
  ev,
  onDelete,
  onClick,
  showDate,
}: {
  ev: EventItem;
  onDelete?: () => void;
  onClick?: () => void;
  showDate?: boolean;
}) {
  const cat = getCategory(ev.category);
  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all ${
        onClick ? "cursor-pointer hover:shadow-soft active:scale-[0.99]" : ""
      }`}
    >
      <CategoryBadge id={ev.category} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{ev.title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${cat.dot}`} />
          <span className={cat.text}>{cat.label}</span>
          <span aria-hidden>•</span>
          <span>{ev.time}</span>
          {showDate && (
            <>
              <span aria-hidden>•</span>
              <span className="truncate">{formatDateLabel(ev.date)}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="grid h-7 w-7 place-items-center text-muted-foreground">
          {ev.notify ? <Bell size={14} /> : <BellOff size={14} />}
        </span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="حذف الموعد"
            className="grid h-8 w-8 place-items-center rounded-xl text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyAgenda({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-background px-6 py-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles size={26} strokeWidth={2} />
      </span>
      <p className="mt-4 font-display text-base font-bold text-foreground">يومك خالٍ تماماً!</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        لا توجد مواعيد مسجّلة اليوم. أضف موعداً جديداً لتبدأ تنظيم وقتك.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus size={16} /> إضافة موعد
      </button>
    </div>
  );
}

/* ---------------------------- page ---------------------------- */

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
  const [category, setCategory] = useState<CategoryId>("other");
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

  const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDay = today.getDate();
  const todayEvents = byDate[todayKey] ?? [];

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => e.date > todayKey)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
      .slice(0, 6);
  }, [events, todayKey]);

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
    setCategory("other");
  };

  const openDate = (dateStr: string) => {
    const [y, m] = dateStr.split("-").map(Number);
    setYear(y!);
    setMonth(m! - 1);
    setSelected(dateStr);
    setTitle("");
    setTime("09:00");
    setNotify(true);
    setRemind(10);
    setCategory("other");
  };

  const pickCategory = (id: CategoryId) => {
    setCategory(id);
    const cat = getCategory(id);
    if (!title.trim() || CATEGORIES.some((c) => c.defaultTitle === title)) {
      setTitle(cat.defaultTitle);
    }
  };

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !title.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: selected,
        title: title.trim(),
        time,
        notify,
        remind,
        category,
      },
    ]);
    if (notify && permission !== "granted") void askPermission();
    setTitle("");
    setCategory("other");
  };

  const remove = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const selectedEvents = selected ? (byDate[selected] ?? []) : [];

  const closeDrawer = () => {
    setDrawerClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setDrawerClosing(false);
    }, 250);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch) touchStartX.current = touch.screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const delta = touch.screenX - touchStartX.current;
    if (delta < -50) shift(1);
    else if (delta > 50) shift(-1);
    touchStartX.current = null;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <CalendarDays size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-extrabold text-foreground">مِيعاد</h2>
          <p className="truncate text-xs text-muted-foreground">تقويمك الذكي</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-xs text-muted-foreground">اليوم</p>
        <p className="mt-1 font-display text-base font-bold text-foreground">
          {formatDateLabel(todayKey)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {todayEvents.length > 0 ? `${todayEvents.length} مواعيد اليوم` : "لا مواعيد اليوم"}
        </p>
        <button
          onClick={() => {
            openDate(todayKey);
            closeDrawer();
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> إضافة موعد جديد
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-3 font-display text-sm font-bold text-foreground">المواعيد القادمة</h3>
        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
          {upcomingEvents.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
              لا توجد مواعيد قادمة
            </p>
          )}
          {upcomingEvents.map((ev) => (
            <div key={ev.id} onClick={closeDrawer}>
              <EventCard ev={ev} showDate onClick={() => openDate(ev.date)} />
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-xs text-muted-foreground">صُنع بواسطة فارس</footer>
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate font-display text-lg font-extrabold text-foreground">مِيعاد</h1>
            <p className="truncate text-[11px] text-muted-foreground">تقويمك الذكي</p>
          </div>
          <button
            onClick={() => openDate(todayKey)}
            aria-label="إضافة موعد اليوم"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-57px)] sm:min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-l border-border bg-card p-5 sm:flex sm:flex-col lg:w-80">
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
                className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
              >
                <X size={16} />
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
              <h1 className="truncate font-display text-3xl font-extrabold text-foreground sm:text-4xl">
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
                className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => {
                  setYear(today.getFullYear());
                  setMonth(today.getMonth());
                }}
                className="rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                اليوم
              </button>
              <button
                onClick={() => shift(1)}
                aria-label="الشهر التالي"
                className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
              {/* Sticky calendar header */}
              <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-border bg-card px-4 pb-3 sm:static sm:top-0 sm:-mx-6 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate font-display text-lg font-bold text-foreground sm:text-xl">
                    {MONTHS[month]} {year}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2 sm:hidden">
                    <button
                      onClick={() => shift(-1)}
                      aria-label="الشهر السابق"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-foreground transition-colors active:scale-95"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setYear(today.getFullYear());
                        setMonth(today.getMonth());
                      }}
                      className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => shift(1)}
                      aria-label="الشهر التالي"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-foreground transition-colors active:scale-95"
                    >
                      <ChevronLeft size={16} />
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
                {DAYS.map((d, i) => (
                  <div
                    key={d}
                    className="truncate py-2 text-center text-[11px] font-semibold text-muted-foreground sm:text-sm"
                  >
                    <span className="sm:hidden">{DAYS_SHORT[i]}</span>
                    <span className="hidden sm:inline">{d}</span>
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
                      onClick={() => openDate(k)}
                      className={`flex min-h-16 flex-col items-stretch gap-1.5 rounded-2xl border p-2 text-right transition-all active:scale-95 sm:min-h-28 sm:p-3 ${
                        isToday
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-accent"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold sm:text-base ${
                          isToday ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>

                      {/* mobile: colored dots */}
                      <span className="flex flex-wrap gap-1 sm:hidden">
                        {list.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={`h-1.5 w-1.5 rounded-full ${getCategory(ev.category).dot}`}
                          />
                        ))}
                      </span>

                      {/* desktop: chips */}
                      <span className="hidden w-full flex-1 flex-col gap-1 overflow-hidden sm:flex">
                        {list.slice(0, 2).map((ev) => {
                          const cat = getCategory(ev.category);
                          return (
                            <span
                              key={ev.id}
                              className={`flex w-full items-center gap-1 truncate rounded-lg px-1.5 py-1 text-[11px] font-medium ${cat.bg} ${cat.text}`}
                            >
                              <cat.icon size={11} className="shrink-0" />
                              <span className="truncate">
                                {ev.time} {ev.title}
                              </span>
                            </span>
                          );
                        })}
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

            {/* Today's visual agenda */}
            <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
              <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-bold text-foreground">
                    أجندة اليوم
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDateLabel(todayKey)}
                  </p>
                </div>
                <button
                  onClick={() => openDate(todayKey)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <Plus size={14} /> إضافة
                </button>
              </div>

              {todayEvents.length === 0 ? (
                <EmptyAgenda onAdd={() => openDate(todayKey)} />
              ) : (
                <div className="space-y-2">
                  {todayEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      onDelete={() => remove(ev.id)}
                      onClick={() => openDate(ev.date)}
                    />
                  ))}
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-display text-sm font-bold text-foreground">
                    مواعيد قادمة
                  </h3>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 3).map((ev) => (
                      <EventCard key={ev.id} ev={ev} showDate onClick={() => openDate(ev.date)} />
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-6 text-center text-xs text-muted-foreground sm:hidden">
                صُنع بواسطة فارس
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* Event modal / bottom sheet */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm fade-in sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-soft scale-in sm:rounded-3xl sm:p-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" />

            <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-extrabold text-foreground">
                  إضافة موعد جديد
                </h3>
                <p className="truncate text-xs text-muted-foreground">{formatDateLabel(selected)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="إغلاق"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={addEvent} className="space-y-4">
              {/* Category picker */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  نوع الموعد
                </label>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {CATEGORIES.map((cat) => {
                    const active = cat.id === category;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => pickCategory(cat.id)}
                        className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-all active:scale-95 ${
                          active
                            ? `border-transparent ring-2 ${cat.ring} ${cat.bg}`
                            : "border-border bg-background hover:bg-accent"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-xl ${cat.bg} ${cat.text}`}
                        >
                          <Icon size={17} strokeWidth={2.2} />
                        </span>
                        <span
                          className={`text-[10px] font-semibold leading-tight ${
                            active ? cat.text : "text-muted-foreground"
                          }`}
                        >
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="title">
                  اسم الموعد
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: موعد الطبيب"
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="time">
                  الوقت
                </label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                  <Bell size={16} className="shrink-0 text-primary" />
                  تفعيل التنبيهات
                </span>
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                />
              </label>

              {notify && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="remind">
                    التذكير قبل الموعد
                  </label>
                  <select
                    id="remind"
                    value={remind}
                    onChange={(e) => setRemind(Number(e.target.value))}
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
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
                <div className="flex items-start gap-2 rounded-2xl border border-border bg-secondary/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  <BellOff size={14} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    {permission === "unsupported" ? (
                      "متصفحك لا يدعم تنبيهات الويب، سيتم حفظ الموعد بدون إشعار."
                    ) : permission === "denied" ? (
                      "التنبيهات محظورة في إعدادات المتصفح لهذا الموقع."
                    ) : (
                      <button
                        type="button"
                        onClick={askPermission}
                        className="font-semibold text-primary underline"
                      >
                        السماح بالتنبيهات في المتصفح
                      </button>
                    )}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.99]"
              >
                <Plus size={16} /> إضافة الموعد
              </button>
            </form>

            <div className="mt-6 space-y-2">
              <h4 className="font-display text-sm font-bold text-foreground">مواعيد هذا اليوم</h4>
              {selectedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Sparkles size={20} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-foreground">يومك خالٍ!</p>
                  <p className="mt-1 text-xs text-muted-foreground">أضف موعدك الأول بالأعلى</p>
                </div>
              ) : (
                selectedEvents.map((ev) => (
                  <EventCard key={ev.id} ev={ev} onDelete={() => remove(ev.id)} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
