import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getCategory } from "@/lib/event-categories";
import { DAYS, DAYS_SHORT, MONTHS, dateKey, key, useEvents } from "@/lib/events";
import { EventSheet } from "@/components/mee3ad/event-sheet";
import { BottomNav } from "@/components/mee3ad/bottom-nav";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم الشامل | مِيعاد" },
      {
        name: "description",
        content: "استعرض شهرك كاملاً في مِيعاد، تنقّل بين الشهور بالسحب، واضغط أي يوم لإضافة موعد.",
      },
      { property: "og:title", content: "التقويم الشامل | مِيعاد" },
      {
        property: "og:description",
        content: "عرض شهري تفاعلي لمواعيدك مع أيقونات ملوّنة لكل نوع موعد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { byDate, permission, askPermission, add, remove } = useEvents();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const todayKey = dateKey(today);

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

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-foreground">
              التقويم الشامل
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {MONTHS[month]} {year}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => shift(-1)}
              aria-label="الشهر السابق"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              <ChevronRight size={17} />
            </button>
            <button
              onClick={() => {
                setYear(today.getFullYear());
                setMonth(today.getMonth());
              }}
              className="rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-accent"
            >
              اليوم
            </button>
            <button
              onClick={() => shift(1)}
              aria-label="الشهر التالي"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft size={17} />
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-border bg-card p-3 shadow-soft sm:p-5">
          <div
            key={`${year}-${month}`}
            className="month-fade grid grid-cols-7 gap-1 sm:gap-2"
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.screenX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current == null) return;
              const delta = (e.changedTouches[0]?.screenX ?? 0) - touchStartX.current;
              if (delta < -50) shift(1);
              else if (delta > 50) shift(-1);
              touchStartX.current = null;
            }}
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
                  onClick={() => setSheetDate(k)}
                  className={`flex min-h-16 flex-col items-stretch gap-1.5 rounded-2xl border p-2 text-right transition-all active:scale-95 sm:min-h-24 sm:p-3 ${
                    isToday
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <span
                    className={`text-sm font-bold sm:text-base ${isToday ? "text-primary" : "text-foreground"}`}
                  >
                    {day}
                  </span>

                  <span className="flex flex-wrap gap-1 sm:hidden">
                    {list.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`h-1.5 w-1.5 rounded-full ${getCategory(ev.category).dot}`}
                      />
                    ))}
                  </span>

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

        <button
          onClick={() => setSheetDate(todayKey)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> إضافة موعد اليوم
        </button>
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
