import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Calendar, Check, Moon, Settings as SettingsIcon, Video } from "lucide-react";
import { useEvents } from "@/lib/events";
import { BottomNav } from "@/components/mee3ad/bottom-nav";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والتكامل | مِيعاد" },
      {
        name: "description",
        content: "أدر تنبيهات مِيعاد وربط التقويم مع Zoom وMicrosoft Teams وتقويم Google.",
      },
      { property: "og:title", content: "الإعدادات والتكامل | مِيعاد" },
      {
        property: "og:description",
        content: "تحكم في التنبيهات والمظهر وخيارات التكامل مع تطبيقات الاجتماعات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const INTEGRATIONS = [
  { id: "zoom", label: "Zoom", desc: "إنشاء روابط اجتماعات تلقائياً", icon: Video },
  { id: "teams", label: "Microsoft Teams", desc: "مزامنة اجتماعات العمل", icon: Video },
  { id: "google", label: "تقويم Google", desc: "استيراد وتصدير المواعيد", icon: Calendar },
];

function SettingsPage() {
  const { permission, askPermission, events } = useEvents();
  const [connected, setConnected] = useState<string[]>([]);
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <header className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
            <SettingsIcon size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-foreground">
              الإعدادات والتكامل
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {events.length} موعد محفوظ في متصفحك
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/12 text-primary">
              <Bell size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">تنبيهات المتصفح</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {permission === "granted"
                  ? "مفعّلة — ستصلك التذكيرات في وقتها"
                  : permission === "denied"
                    ? "محظورة من إعدادات المتصفح"
                    : "غير مفعّلة بعد"}
              </p>
            </div>
            <button
              onClick={askPermission}
              disabled={permission === "granted"}
              className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
            >
              {permission === "granted" ? "مفعّلة" : "تفعيل"}
            </button>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cat-meeting/12 text-cat-meeting">
              <Moon size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">الوضع الليلي</p>
              <p className="truncate text-[11px] text-muted-foreground">مظهر داكن مريح للعين</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${dark ? "bg-primary" : "bg-secondary"}`}
              aria-label="تبديل الوضع الليلي"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-card transition-transform ${dark ? "-translate-x-5" : ""}`}
              />
            </button>
          </div>
        </section>

        <h2 className="mb-3 mt-6 font-display text-sm font-bold text-foreground">
          التكامل مع التطبيقات
        </h2>
        <section className="space-y-3">
          {INTEGRATIONS.map((it) => {
            const on = connected.includes(it.id);
            const Icon = it.icon;
            return (
              <div
                key={it.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{it.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{it.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setConnected((c) => (on ? c.filter((x) => x !== it.id) : [...c, it.id]))
                  }
                  className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors ${
                    on
                      ? "bg-primary/12 text-primary"
                      : "border border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {on && <Check size={12} />} {on ? "مرتبط" : "ربط"}
                </button>
              </div>
            );
          })}
        </section>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">صُنع بواسطة فارس</p>
      </div>

      <BottomNav />
    </div>
  );
}
