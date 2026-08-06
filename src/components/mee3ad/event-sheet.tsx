import { useState, type FormEvent } from "react";
import { Bell, BellOff, Link2, MapPin, Plus, Sparkles, X } from "lucide-react";
import { CATEGORIES, getCategory, type CategoryId } from "@/lib/event-categories";
import { formatDateLabel, REMIND_OPTIONS, type EventItem } from "@/lib/events";
import { EventCard } from "./event-card";

export function EventSheet({
  date,
  dayEvents,
  permission,
  askPermission,
  onClose,
  onAdd,
  onDelete,
}: {
  date: string;
  dayEvents: EventItem[];
  permission: NotificationPermission | "unsupported";
  askPermission: () => void;
  onClose: () => void;
  onAdd: (ev: Omit<EventItem, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [notify, setNotify] = useState(true);
  const [remind, setRemind] = useState(10);
  const [category, setCategory] = useState<CategoryId>("other");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");

  const pickCategory = (id: CategoryId) => {
    setCategory(id);
    const cat = getCategory(id);
    if (!title.trim() || CATEGORIES.some((c) => c.defaultTitle === title)) setTitle(cat.defaultTitle);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      date,
      title: title.trim(),
      time,
      notify,
      remind,
      category,
      location: location.trim() || undefined,
      link: link.trim() || undefined,
    });
    if (notify && permission !== "granted") askPermission();
    setTitle("");
    setLocation("");
    setLink("");
    setCategory("other");
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm fade-in sm:items-center sm:p-4"
      onClick={onClose}
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
            <p className="truncate text-xs text-muted-foreground">{formatDateLabel(date)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
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
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${cat.bg} ${cat.text}`}>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="time">
                الوقت
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="loc">
                المكان / المنصة
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3">
                <MapPin size={14} className="shrink-0 text-muted-foreground" />
                <input
                  id="loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مستشفى الحبيب"
                  className="w-full bg-transparent py-3 text-sm text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="link">
              رابط الاجتماع (اختياري)
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3">
              <Link2 size={14} className="shrink-0 text-muted-foreground" />
              <input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://zoom.us/..."
                dir="ltr"
                className="w-full bg-transparent py-3 text-left text-sm text-foreground outline-none"
              />
            </div>
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
          {dayEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles size={20} />
              </span>
              <p className="mt-3 text-sm font-semibold text-foreground">يومك خالٍ!</p>
              <p className="mt-1 text-xs text-muted-foreground">أضف موعدك الأول بالأعلى</p>
            </div>
          ) : (
            dayEvents.map((ev) => (
              <EventCard key={ev.id} ev={ev} compact onDelete={() => onDelete(ev.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
