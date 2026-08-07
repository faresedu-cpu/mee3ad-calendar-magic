import { useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryId } from "./event-categories";

export type EventItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string;
  notify: boolean;
  remind?: number | undefined; // دقائق قبل الموعد (قديم — للتوافق)
  reminders?: number[] | undefined; // تذكيرات متعددة بالدقائق
  category?: CategoryId | undefined;
  location?: string | undefined;
  link?: string | undefined;
  done?: boolean | undefined;
};

export const STORAGE_KEY = "mee3ad-events";
export const FIRED_KEY = "mee3ad-fired";

export type RemindOption = { minutes: number; label: string; group: "short" | "long" };

export const REMIND_OPTIONS: RemindOption[] = [
  { minutes: 0, label: "في وقت الموعد", group: "short" },
  { minutes: 5, label: "قبل 5 دقائق", group: "short" },
  { minutes: 10, label: "قبل 10 دقائق", group: "short" },
  { minutes: 15, label: "قبل 15 دقيقة", group: "short" },
  { minutes: 30, label: "قبل 30 دقيقة", group: "short" },
  { minutes: 45, label: "قبل 45 دقيقة", group: "short" },
  { minutes: 60, label: "قبل ساعة", group: "short" },
  { minutes: 120, label: "قبل ساعتين", group: "short" },
  { minutes: 180, label: "قبل 3 ساعات", group: "short" },
  { minutes: 360, label: "قبل 6 ساعات", group: "short" },
  { minutes: 720, label: "قبل 12 ساعة", group: "short" },
  { minutes: 1440, label: "قبل يوم", group: "long" },
  { minutes: 2880, label: "قبل يومين", group: "long" },
  { minutes: 4320, label: "قبل 3 أيام", group: "long" },
  { minutes: 10080, label: "قبل أسبوع", group: "long" },
];

export const remindLabel = (m: number) =>
  REMIND_OPTIONS.find((o) => o.minutes === m)?.label ?? `قبل ${m} دقيقة`;

export const eventReminders = (ev: EventItem): number[] =>
  ev.reminders?.length ? ev.reminders : [ev.remind ?? 10];


export const MONTHS = [
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
export const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const DAYS_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const dateKey = (d: Date) => key(d.getFullYear(), d.getMonth(), d.getDate());

export function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m! - 1]} ${y}`;
}

export function eventTimestamp(ev: EventItem) {
  const [h, mi] = ev.time.split(":").map(Number);
  const [y, m, d] = ev.date.split("-").map(Number);
  return new Date(y!, m! - 1, d!, h ?? 0, mi ?? 0).getTime();
}

/** أنواع تتطلب تحرك مبكر (مسافة/مرور) */
export const TRAVEL_CATEGORIES: CategoryId[] = ["doctor", "family", "social"];

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);
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

  useEffect(() => {
    if (typeof Notification === "undefined") setPermission("unsupported");
    else setPermission(Notification.permission);
  }, []);

  const askPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return setPermission("unsupported");
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      /* ignore */
    }
  }, []);

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
      if (!ev.notify || ev.done || fired.includes(ev.id)) continue;
      const minutes = ev.remind ?? 10;
      const delay = eventTimestamp(ev) - minutes * 60_000 - now;
      if (delay < -60_000 || delay > 24 * 3600_000) continue;
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

  const add = useCallback((ev: Omit<EventItem, "id">) => {
    setEvents((prev) => [...prev, { ...ev, id: crypto.randomUUID() }]);
  }, []);

  const remove = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<EventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const toggleDone = useCallback((id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
  }, []);

  const snooze = useCallback((id: string, minutes = 15) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const t = new Date(eventTimestamp(e) + minutes * 60_000);
        return {
          ...e,
          date: dateKey(t),
          time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
        };
      }),
    );
  }, []);

  return {
    events,
    byDate,
    loaded,
    permission,
    askPermission,
    add,
    remove,
    update,
    toggleDone,
    snooze,
  };
}
