import {
  BookOpen,
  Stethoscope,
  Video,
  Pill,
  Home,
  Coffee,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export type CategoryId =
  | "study"
  | "doctor"
  | "meeting"
  | "medicine"
  | "family"
  | "social"
  | "other";

export type EventCategory = {
  id: CategoryId;
  label: string;
  defaultTitle: string;
  icon: LucideIcon;
  /** tailwind classes driven by semantic category tokens */
  text: string;
  bg: string;
  ring: string;
  dot: string;
};

export const CATEGORIES: EventCategory[] = [
  {
    id: "study",
    label: "واجب مدرسي",
    defaultTitle: "واجب مدرسي",
    icon: BookOpen,
    text: "text-cat-study",
    bg: "bg-cat-study/12",
    ring: "ring-cat-study/40",
    dot: "bg-cat-study",
  },
  {
    id: "doctor",
    label: "موعد طبيب",
    defaultTitle: "موعد طبيب",
    icon: Stethoscope,
    text: "text-cat-doctor",
    bg: "bg-cat-doctor/12",
    ring: "ring-cat-doctor/40",
    dot: "bg-cat-doctor",
  },
  {
    id: "meeting",
    label: "اجتماع مرئي",
    defaultTitle: "اجتماع عبر زوم",
    icon: Video,
    text: "text-cat-meeting",
    bg: "bg-cat-meeting/12",
    ring: "ring-cat-meeting/40",
    dot: "bg-cat-meeting",
  },
  {
    id: "medicine",
    label: "تناول الدواء",
    defaultTitle: "تناول الدواء",
    icon: Pill,
    text: "text-cat-medicine",
    bg: "bg-cat-medicine/12",
    ring: "ring-cat-medicine/40",
    dot: "bg-cat-medicine",
  },
  {
    id: "family",
    label: "خروج عائلي",
    defaultTitle: "خروج عائلي",
    icon: Home,
    text: "text-cat-family",
    bg: "bg-cat-family/12",
    ring: "ring-cat-family/40",
    dot: "bg-cat-family",
  },
  {
    id: "social",
    label: "لقاء أصدقاء",
    defaultTitle: "لقاء مع الأصدقاء",
    icon: Coffee,
    text: "text-cat-social",
    bg: "bg-cat-social/12",
    ring: "ring-cat-social/40",
    dot: "bg-cat-social",
  },
  {
    id: "other",
    label: "موعد آخر",
    defaultTitle: "",
    icon: CalendarDays,
    text: "text-cat-other",
    bg: "bg-cat-other/12",
    ring: "ring-cat-other/40",
    dot: "bg-cat-other",
  },
];

export const getCategory = (id?: string): EventCategory =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;
