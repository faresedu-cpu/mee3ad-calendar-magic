import { useCallback, useEffect, useMemo, useState } from "react";
import { dateKey } from "./events";

export type HomeworkStatus = "doing" | "review" | "done";

export type SubTask = { id: string; title: string; done: boolean };

export type Homework = {
  id: string;
  title: string;
  subject: string;
  due: string; // YYYY-MM-DD
  status: HomeworkStatus;
  subtasks: SubTask[];
};

export type FocusSession = { id: string; date: string; minutes: number };

export const HOMEWORK_KEY = "mee3ad-homework";
export const FOCUS_KEY = "mee3ad-focus-sessions";

export const HOMEWORK_STATUSES: { id: HomeworkStatus; label: string; tone: string }[] = [
  { id: "doing", label: "قيد العمل", tone: "bg-cat-study/12 text-cat-study" },
  { id: "review", label: "قيد المراجعة", tone: "bg-cat-medicine/12 text-cat-medicine" },
  { id: "done", label: "تم التسليم", tone: "bg-primary/12 text-primary" },
];

function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (loaded) localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}

export function useHomework() {
  const [items, setItems] = useStored<Homework[]>(HOMEWORK_KEY, []);

  const add = useCallback(
    (hw: Omit<Homework, "id" | "subtasks" | "status"> & Partial<Pick<Homework, "status">>) => {
      setItems((prev) => [
        ...prev,
        { subtasks: [], status: "doing", ...hw, id: crypto.randomUUID() },
      ]);
    },
    [setItems],
  );

  const update = useCallback(
    (id: string, patch: Partial<Homework>) => {
      setItems((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((h) => h.id !== id)),
    [setItems],
  );

  const addSubtask = useCallback(
    (id: string, title: string) => {
      setItems((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, subtasks: [...h.subtasks, { id: crypto.randomUUID(), title, done: false }] }
            : h,
        ),
      );
    },
    [setItems],
  );

  const toggleSubtask = useCallback(
    (id: string, subId: string) => {
      setItems((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                subtasks: h.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
              }
            : h,
        ),
      );
    },
    [setItems],
  );

  return { items, add, update, remove, addSubtask, toggleSubtask };
}

export function useFocusSessions() {
  const [sessions, setSessions] = useStored<FocusSession[]>(FOCUS_KEY, []);

  const log = useCallback(
    (minutes: number) => {
      setSessions((prev) => [
        ...prev.slice(-300),
        { id: crypto.randomUUID(), date: dateKey(new Date()), minutes },
      ]);
    },
    [setSessions],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    const startKey = dateKey(start);

    const week = sessions.filter((s) => s.date >= startKey);
    const weekMinutes = week.reduce((sum, s) => sum + s.minutes, 0);

    const days = new Set(sessions.map((s) => s.date));
    let streak = 0;
    const d = new Date(now);
    for (let i = 0; i < 90; i++) {
      const k = dateKey(d);
      if (days.has(k)) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }

    const perDay = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const k = dateKey(day);
      return { key: k, minutes: sessions.filter((s) => s.date === k).reduce((a, s) => a + s.minutes, 0) };
    });

    return { weekMinutes, sessions: week.length, streak, perDay };
  }, [sessions]);

  return { sessions, log, stats };
}

export function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} ساعة و${m} دقيقة`;
  if (h) return `${h} ساعة`;
  return `${m} دقيقة`;
}
