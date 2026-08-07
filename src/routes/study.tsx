import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, CheckCircle2, ChevronDown, Flame, Plus, Trash2, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/mee3ad/bottom-nav";
import { FocusTimer } from "@/components/mee3ad/focus-timer";
import {
  HOMEWORK_STATUSES,
  formatMinutes,
  useFocusSessions,
  useHomework,
  type HomeworkStatus,
} from "@/lib/study";
import { DAYS_SHORT, dateKey, formatDateLabel } from "@/lib/events";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "الدراسة والتركيز | مِيعاد" },
      {
        name: "description",
        content:
          "مساحة الدراسة في مِيعاد: مؤقت بومودورو، متابعة الواجبات والمهام الفرعية، وإحصائيات ساعات التركيز الأسبوعية.",
      },
      { property: "og:title", content: "الدراسة والتركيز | مِيعاد" },
      {
        property: "og:description",
        content: "نظّم واجباتك، قسّمها لخطوات، وتابع ساعات تركيزك أسبوعياً.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudyHub,
});

const FILTERS: { id: "all" | HomeworkStatus; label: string }[] = [
  { id: "all", label: "الكل" },
  ...HOMEWORK_STATUSES.map((s) => ({ id: s.id, label: s.label })),
];

function StudyHub() {
  const { items, add, update, remove, addSubtask, toggleSubtask } = useHomework();
  const { log, stats } = useFocusSessions();
  const { profile } = useProfile();
  const [filter, setFilter] = useState<"all" | HomeworkStatus>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState(dateKey(new Date()));
  const [sub, setSub] = useState("");

  const filtered = useMemo(
    () =>
      [...items]
        .filter((h) => filter === "all" || h.status === filter)
        .sort((a, b) => a.due.localeCompare(b.due)),
    [items, filter],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    add({ title: title.trim(), subject: subject.trim() || "عام", due });
    setTitle("");
    setSubject("");
  };

  const maxMin = Math.max(60, ...stats.perDay.map((d) => d.minutes));
  const doneCount = items.filter((h) => h.status === "done").length;

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-2xl px-4 pt-4 lg:max-w-5xl">
        <header className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cat-study/12 text-cat-study">
            <BookOpen size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-foreground">
              الدراسة والتركيز
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              مساحتك للمذاكرة يا {profile.name} — ركّز، سلّم، تقدّم 📚
            </p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-4">
            <FocusTimer expanded sound={profile.sound} onComplete={log} />

            {/* Analytics */}
            <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <TrendingUp size={17} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-sm font-bold text-foreground">
                    تحليلات المذاكرة
                  </h2>
                  <p className="truncate text-[11px] text-muted-foreground">
                    إجمالي ساعات التركيز هذا الأسبوع: {formatMinutes(stats.weekMinutes)} 📚
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-secondary/50 p-3 text-center">
                  <p className="font-display text-lg font-extrabold text-foreground">
                    {stats.sessions}
                  </p>
                  <p className="text-[10px] text-muted-foreground">جلسة تركيز</p>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3 text-center">
                  <p className="font-display text-lg font-extrabold text-foreground">{doneCount}</p>
                  <p className="text-[10px] text-muted-foreground">واجب مُسلّم</p>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3 text-center">
                  <p className="font-display text-lg font-extrabold text-foreground">
                    {stats.streak} <Flame size={13} className="inline text-cat-medicine" />
                  </p>
                  <p className="text-[10px] text-muted-foreground">أيام متتالية</p>
                </div>
              </div>

              <div className="mt-4 flex h-28 items-end justify-between gap-1.5">
                {stats.perDay.map((d, i) => (
                  <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {d.minutes ? d.minutes : ""}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-primary/80 transition-all"
                      style={{ height: `${Math.max(4, (d.minutes / maxMin) * 80)}px` }}
                    />
                    <span className="truncate text-[9px] text-muted-foreground">
                      {DAYS_SHORT[i]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Homework ledger */}
          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-bold text-foreground">
              سجل الواجبات والمهام
            </h2>

            <form onSubmit={submit} className="mb-4 space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اسم الواجب أو المشروع"
                className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="المادة"
                  className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus size={15} /> إضافة واجب
              </button>
            </form>

            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
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

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cat-study/12 text-cat-study">
                  <CheckCircle2 size={22} />
                </span>
                <p className="mt-3 text-sm font-bold text-foreground">لا توجد واجبات هنا</p>
                <p className="mt-1 text-xs text-muted-foreground">أضف واجبك الأول وابدأ التخطيط</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((h) => {
                  const status = HOMEWORK_STATUSES.find((s) => s.id === h.status)!;
                  const doneSubs = h.subtasks.filter((s) => s.done).length;
                  const isOpen = open === h.id;
                  return (
                    <li
                      key={h.id}
                      className="rounded-2xl border border-border bg-background p-3 transition-colors"
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                        <button
                          onClick={() => setOpen(isOpen ? null : h.id)}
                          className="min-w-0 text-right"
                        >
                          <p className="truncate text-sm font-bold text-foreground">{h.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {h.subject} • تسليم {formatDateLabel(h.due)}
                            {h.subtasks.length ? ` • ${doneSubs}/${h.subtasks.length} خطوات` : ""}
                          </p>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.tone}`}
                          >
                            {status.label}
                          </span>
                          <button
                            onClick={() => setOpen(isOpen ? null : h.id)}
                            aria-label="تفاصيل"
                            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                          >
                            <ChevronDown
                              size={14}
                              className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
                            />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 space-y-3 border-t border-dashed border-border pt-3">
                          <div className="flex flex-wrap gap-1.5">
                            {HOMEWORK_STATUSES.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => update(h.id, { status: s.id })}
                                className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition-all ${
                                  h.status === s.id
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-card text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                            <button
                              onClick={() => remove(h.id)}
                              aria-label="حذف"
                              className="mr-auto grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <ul className="space-y-1.5">
                            {h.subtasks.map((s) => (
                              <li key={s.id}>
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                                  <input
                                    type="checkbox"
                                    checked={s.done}
                                    onChange={() => toggleSubtask(h.id, s.id)}
                                    className="h-4 w-4 accent-[var(--primary)]"
                                  />
                                  <span className={s.done ? "text-muted-foreground line-through" : ""}>
                                    {s.title}
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ul>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!sub.trim()) return;
                              addSubtask(h.id, sub.trim());
                              setSub("");
                            }}
                            className="flex gap-2"
                          >
                            <input
                              value={sub}
                              onChange={(e) => setSub(e.target.value)}
                              placeholder="أضف خطوة صغيرة…"
                              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                            />
                            <button
                              type="submit"
                              aria-label="إضافة خطوة"
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
                            >
                              <Plus size={14} />
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">صُنع بواسطة فارس</p>
      </div>

      <BottomNav />
    </div>
  );
}
