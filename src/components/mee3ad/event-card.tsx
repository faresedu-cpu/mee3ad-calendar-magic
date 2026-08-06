import {
  Bell,
  BellOff,
  Check,
  ExternalLink,
  MapPin,
  Timer,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { getCategory, type CategoryId } from "@/lib/event-categories";
import { formatDateLabel, TRAVEL_CATEGORIES, type EventItem } from "@/lib/events";

export function CategoryBadge({
  id,
  size = "md",
}: {
  id?: CategoryId | undefined;
  size?: "sm" | "md";
}) {
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

export function EventCard({
  ev,
  onDelete,
  onClick,
  onToggleDone,
  onSnooze,
  showDate,
  compact,
}: {
  ev: EventItem;
  onDelete?: () => void;
  onClick?: () => void;
  onToggleDone?: () => void;
  onSnooze?: () => void;
  showDate?: boolean;
  compact?: boolean;
}) {
  const cat = getCategory(ev.category);
  const needsBuffer =
    !ev.done && TRAVEL_CATEGORIES.includes((ev.category ?? "other") as CategoryId);

  return (
    <article
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all ${
        onClick ? "cursor-pointer hover:shadow-soft active:scale-[0.99]" : ""
      } ${ev.done ? "opacity-60" : ""}`}
    >
      <span className={`absolute inset-y-0 right-0 w-1 ${cat.dot}`} aria-hidden />

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 pr-2">
        <CategoryBadge id={ev.category} />
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-bold text-foreground ${ev.done ? "line-through" : ""}`}
          >
            {ev.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
            <span className={`font-semibold ${cat.text}`}>{cat.label}</span>
            <span aria-hidden>•</span>
            <span className="font-semibold text-foreground">{ev.time}</span>
            {showDate && (
              <>
                <span aria-hidden>•</span>
                <span className="truncate">{formatDateLabel(ev.date)}</span>
              </>
            )}
          </p>
          {ev.location && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-lg bg-secondary/60 px-2 py-1 text-[11px] font-medium text-secondary-foreground">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{ev.location}</span>
            </p>
          )}
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

      {!compact && needsBuffer && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-cat-medicine/12 px-2.5 py-2 text-[11px] leading-relaxed text-cat-medicine">
          <TriangleAlert size={13} className="mt-0.5 shrink-0" />
          ينصح بالتحرك قبل الموعد بـ ٢٠ دقيقة بناءً على حركة المرور
        </p>
      )}

      {!compact && (onToggleDone || onSnooze || ev.link) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ev.link && (
            <a
              href={ev.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ExternalLink size={12} /> الانضمام للاجتماع
            </a>
          )}
          {onToggleDone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone();
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${
                ev.done
                  ? "border-primary bg-primary/12 text-primary"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              <Check size={12} /> {ev.done ? "تم الإنجاز" : "تمييز كمنجز"}
            </button>
          )}
          {onSnooze && !ev.done && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-bold text-foreground transition-colors hover:bg-accent"
            >
              <Timer size={12} /> تأجيل ١٥ د
            </button>
          )}
        </div>
      )}
    </article>
  );
}
