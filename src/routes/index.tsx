import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarRange,
  CheckCircle2,
  Flame,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { getCategory, type CategoryId } from "@/lib/event-categories";
import {
  DAYS_SHORT,
  MONTHS,
  dateKey,
  eventTimestamp,
  formatDateLabel,
  useEvents,
  type EventItem,
} from "@/lib/events";
import { EventCard } from "@/components/mee3ad/event-card";
import { EventSheet } from "@/components/mee3ad/event-sheet";
import { FocusTimer } from "@/components/mee3ad/focus-timer";
import { BottomNav } from "@/components/mee3ad/bottom-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مِيعاد | لوحة يومك الذكية" },
      {
        name: "description",
        content:
          "لوحة مِيعاد الرئيسية: أجندة اليوم، إحصائيات إنجازك، شريط الأيام، مؤقت التركيز، واستطلاعات اللقاءات — كل ذلك بالعربية.",
      },
      { property: "og:title", content: "مِيعاد | لوحة يومك الذكية" },
      {
        property: "og:description",
        content: "نظّم يومك مع أجندة تفاعلية، تنبيهات ذكية، مؤقت تركيز، وتنسيق لقاءات الأصدقاء.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const FILTERS: { id: string; label: string; cats: CategoryId[] }[] = [
  { id: "all", label: "الكل", cats: [] },
  { id: "study", label: "واجبات", cats: ["study"] },
  { id: "meeting", label: "اجتماعات", cats: ["meeting"] },
  { id: "social", label: "طلعات أصدقاء", cats: ["social", "family"] },
  { id: "health", label: "صحة وطبيب", cats: ["doctor", "medicine"] },
];

function motivation(pct: number, count: number) {
  if (count === 0) return "يوم هادئ — فرصة ممتازة للتركيز على نفسك ✨";
  if (pct >= 100) return "أنجزت كل مواعيد اليوم! يوم مثالي 🎉";
  if (pct >= 50) return "أنت في منتصف الطريق، استمر بنفس الحماس 💪";
  return "ابدأ بأول مهمة اليوم، الخطوة الأولى هي الأهم 🚀";
}


function StatCard({
  icon,
  tone,
  title,
  value,
  hint,
  progress,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  value: string;
  hint?: string;
  progress?: number;
}) {
  return (
    <div className="w-56 shrink-0 snap-start rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tone}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-muted-foreground">{title}</p>
          <p className="mt-0.5 font-display text-base font-extrabold leading-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {hint && <p className="mt-2 truncate text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { events, byDate, permission, askPermission, add, remove, toggleDone, snooze } = useEvents();
  const today = new Date();
  const todayKey = dateKey(today);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const weekStrip = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [todayKey]);

  const activeCats = FILTERS.find((f) => f.id === filter)?.cats ?? [];

  const dayEvents = useMemo(() => {
    let list = byDate[selectedDate] ?? [];
    if (activeCats.length) list = list.filter((e) => activeCats.includes(e.category ?? "other"));
    if (query.trim()) {
      const q = query.trim();
      list = list.filter(
        (e) => e.title.includes(q) || (e.location ?? "").includes(q) || e.time.includes(q),
      );
    }
    return list;
  }, [byDate, selectedDate, filter, query]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [] as EventItem[];
    const q = query.trim();
    return events
      .filter((e) => e.title.includes(q) || (e.location ?? "").includes(q))
      .sort((a, b) => eventTimestamp(a) - eventTimestamp(b))
      .slice(0, 6);
  }, [events, query]);

  const now = Date.now();
  const nextEvent = useMemo(
    () =>
      events
        .filter((e) => !e.done && eventTimestamp(e) >= now)
        .sort((a, b) => eventTimestamp(a) - eventTimestamp(b))[0],
    [events],
  );

  const weekDone = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    const startKey = dateKey(start);
    const inWeek = events.filter((e) => e.date >= startKey);
    const done = inWeek.filter((e) => e.done).length;
    return { done, total: inWeek.length };
  }, [events, todayKey]);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date(today);
    for (let i = 0; i < 60; i++) {
      const k = dateKey(d);
      const has = (byDate[k] ?? []).length > 0;
      if (!has) {
        if (i === 0) {
          d.setDate(d.getDate() - 1);
          continue;
        }
        break;
      }
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [byDate, todayKey]);

  const nextIn = nextEvent
    ? Math.max(0, Math.round((eventTimestamp(nextEvent) - now) / 60000))
    : null;
  const nextLabel =
    nextIn == null
      ? "لا مواعيد قادمة"
      : nextIn < 60
        ? `خلال ${nextIn} دقيقة`
        : nextIn < 1440
          ? `خلال ${Math.round(nextIn / 60)} ساعة`
          : `بعد ${Math.round(nextIn / 1440)} يوم`;

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-2xl px-4 pt-4 lg:max-w-5xl">
        {/* Header */}
        <header className="rounded-3xl border border-border bg-card/70 p-4 shadow-soft backdrop-blur-xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-lg font-extrabold text-primary-foreground">
                أ
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-extrabold text-foreground">
                  {greetingByHour(today.getHours())}، أحمد 👋
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {dayEvents.length > 0
                    ? "يومك مليء بالمحطات الإيجابية! 🚀"
                    : "يوم هادئ — فرصة ممتازة للتركيز ✨"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={askPermission}
                aria-label="التنبيهات"
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-border bg-background text-foreground transition-colors hover:bg-accent"
              >
                <Bell size={17} />
                {permission !== "granted" && (
                  <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-destructive" />
                )}
              </button>
              <button
                onClick={() => setSheetDate(selectedDate)}
                aria-label="إضافة موعد"
                className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-input bg-background px-3">
            <Search size={15} className="shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في مواعيدك وملاحظاتك…"
              className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none"
            />
          </div>

          {query.trim() && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground">
                نتائج البحث ({searchResults.length})
              </p>
              {searchResults.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  لا توجد نتائج مطابقة
                </p>
              ) : (
                searchResults.map((ev) => <EventCard key={ev.id} ev={ev} compact showDate />)
              )}
            </div>
          )}
        </header>

        {/* Stats */}
        <section className="mt-4">
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            <StatCard
              icon={<CheckCircle2 size={18} />}
              tone="bg-primary/12 text-primary"
              title="إنجاز هذا الأسبوع"
              value={`تم إنجاز ${weekDone.done} مهام`}
              progress={weekDone.total ? (weekDone.done / weekDone.total) * 100 : 0}
              hint={`${weekDone.total} موعد مسجّل هذا الأسبوع`}
            />
            <StatCard
              icon={<Zap size={18} />}
              tone="bg-cat-meeting/12 text-cat-meeting"
              title="الموعد القادم"
              value={nextEvent ? nextEvent.title : "لا يوجد"}
              hint={nextLabel}
            />
            <StatCard
              icon={<Flame size={18} />}
              tone="bg-cat-medicine/12 text-cat-medicine"
              title="أيام تنظيم متتالية"
              value={`${streak} أيام 🔥`}
              hint="استمر، أنت في طريقك الصحيح"
            />
          </div>
        </section>

        {/* Week strip */}
        <section className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate font-display text-sm font-bold text-foreground">
              {MONTHS[today.getMonth()]} {today.getFullYear()}
            </h2>
            <Link
              to="/calendar"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:bg-accent"
            >
              <CalendarRange size={13} /> التقويم الشامل
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekStrip.map((d) => {
              const k = dateKey(d);
              const active = k === selectedDate;
              const isToday = k === todayKey;
              const list = byDate[k] ?? [];
              return (
                <button
                  key={k}
                  onClick={() => setSelectedDate(k)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 transition-all active:scale-95 ${
                    active
                      ? "border-transparent bg-primary text-primary-foreground"
                      : isToday
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <span
                    className={`truncate text-[10px] font-semibold ${active ? "" : "text-muted-foreground"}`}
                  >
                    {DAYS_SHORT[d.getDay()]}
                  </span>
                  <span className="font-display text-sm font-extrabold">{d.getDate()}</span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {list.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-primary-foreground" : getCategory(ev.category).dot
                        }`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter chips */}
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                  filter === f.id
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          {/* Timeline */}
          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-extrabold text-foreground">
                  أجندة اليوم
                </h2>
                <p className="truncate text-[11px] text-muted-foreground">
                  {formatDateLabel(selectedDate)}
                </p>
              </div>
              <button
                onClick={() => setSheetDate(selectedDate)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-bold text-foreground transition-colors hover:bg-accent"
              >
                <Plus size={13} /> إضافة
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-background px-6 py-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles size={26} />
                </span>
                <p className="mt-4 font-display text-base font-bold text-foreground">
                  يومك خالٍ تماماً!
                </p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  لا توجد مواعيد في هذا اليوم. أضف موعداً جديداً وابدأ تنظيم وقتك.
                </p>
                <button
                  onClick={() => setSheetDate(selectedDate)}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus size={16} /> إضافة موعد
                </button>
              </div>
            ) : (
              <ol className="relative space-y-3 border-r border-dashed border-border pr-4">
                {dayEvents.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -right-[22px] top-5 grid h-3 w-3 place-items-center rounded-full border-2 border-card bg-primary" />
                    <span className="absolute -right-14 top-4 hidden w-9 text-left text-[11px] font-bold text-muted-foreground sm:block">
                      {ev.time}
                    </span>
                    <EventCard
                      ev={ev}
                      onDelete={() => remove(ev.id)}
                      onToggleDone={() => toggleDone(ev.id)}
                      onSnooze={() => snooze(ev.id, 15)}
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Smart tools */}
          <section className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cat-social/12 text-cat-social">
                  <Users size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-bold text-foreground">
                    متى تفضّون؟
                  </h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    أنشئ استطلاعاً سريعاً وشاركه مع العائلة أو الأصدقاء للتصويت على أنسب وقت للقاء.
                  </p>
                </div>
              </div>
              <Link
                to="/social"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cat-social/12 px-4 py-2.5 text-xs font-bold text-cat-social transition-opacity hover:opacity-80"
              >
                <Plus size={14} /> إنشاء استطلاع لقاء
              </Link>
            </div>

            <FocusTimer />

            <p className="pt-1 text-center text-[11px] text-muted-foreground">صُنع بواسطة فارس</p>
          </section>
        </div>
      </div>

      {sheetDate && (
        <EventSheet
          date={sheetDate}
          dayEvents={byDate[sheetDate] ?? []}
          permission={permission}
          askPermission={askPermission}
          onClose={() => setSheetDate(null)}
          onAdd={add}
          onDelete={remove}
        />
      )}

      <BottomNav />
    </div>
  );
}
