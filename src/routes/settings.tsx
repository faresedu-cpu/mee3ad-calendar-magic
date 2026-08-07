import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  Info,
  Moon,
  Settings as SettingsIcon,
  User,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { useEvents } from "@/lib/events";
import { useProfile, type Profile } from "@/lib/profile";
import { BottomNav } from "@/components/mee3ad/bottom-nav";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والملف الشخصي | مِيعاد" },
      {
        name: "description",
        content:
          "أدر ملفك الشخصي، التنبيهات، المظهر، وربط التقويم مع Zoom وMicrosoft Teams وتقويم Google في مِيعاد.",
      },
      { property: "og:title", content: "الإعدادات والملف الشخصي | مِيعاد" },
      {
        property: "og:description",
        content: "ملفك الشخصي، أصوات التنبيهات، الوضع الليلي، وخيارات التكامل — كل شيء في مكان واحد.",
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

const GENDERS: { id: Profile["gender"]; label: string }[] = [
  { id: "male", label: "ذكر" },
  { id: "female", label: "أنثى" },
  { id: "", label: "أفضّل عدم الذكر" },
];

function Row({
  icon,
  tone,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur-xl">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${on ? "bg-primary" : "bg-secondary"}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-card transition-transform ${on ? "-translate-x-5" : ""}`}
      />
    </button>
  );
}

function ProfileModal({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile;
  onSave: (p: Partial<Profile>) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(profile);

  const pickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
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
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h3 className="truncate font-display text-lg font-extrabold text-foreground">
            الملف الشخصي
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5 flex flex-col items-center gap-2">
          <label className="cursor-pointer">
            {draft.avatar ? (
              <img
                src={draft.avatar}
                alt="الصورة الشخصية"
                className="h-20 w-20 rounded-3xl object-cover"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-primary font-display text-2xl font-extrabold text-primary-foreground">
                {draft.name.trim().charAt(0) || "م"}
              </span>
            )}
            <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
          </label>
          <span className="text-[11px] text-muted-foreground">اضغط الصورة لتغييرها</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="pname">
              الاسم الكامل
            </label>
            <input
              id="pname"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="اكتب اسمك"
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="page">
                العمر
              </label>
              <input
                id="page"
                inputMode="numeric"
                value={draft.age}
                onChange={(e) => setDraft({ ...draft, age: e.target.value.replace(/\D/g, "") })}
                placeholder="مثال: 21"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="pnat">
                الجنسية
              </label>
              <input
                id="pnat"
                value={draft.nationality}
                onChange={(e) => setDraft({ ...draft, nationality: e.target.value })}
                placeholder="مثال: سعودي"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">الجنس</span>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setDraft({ ...draft, gender: g.id })}
                  className={`flex-1 rounded-2xl border px-2 py-2.5 text-[11px] font-bold transition-all active:scale-95 ${
                    draft.gender === g.id
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Check size={16} /> حفظ الملف الشخصي
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { permission, askPermission, events } = useEvents();
  const { profile, updateProfile } = useProfile();
  const [connected, setConnected] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#profile") setEditing(true);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <header className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
            <SettingsIcon size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-foreground">
              الإعدادات والملف الشخصي
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {events.length} موعد محفوظ في متصفحك
            </p>
          </div>
        </header>

        {/* Profile card */}
        <button
          onClick={() => setEditing(true)}
          className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card/80 p-4 text-right shadow-soft backdrop-blur-xl transition-colors hover:bg-accent/40"
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="صورتك" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary font-display text-xl font-extrabold text-primary-foreground">
              {profile.name.trim().charAt(0) || "م"}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold text-foreground">
              {profile.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {[profile.age && `${profile.age} سنة`, profile.nationality]
                .filter(Boolean)
                .join(" • ") || "أكمل بيانات ملفك الشخصي"}
            </p>
          </div>
          <ChevronLeft size={18} className="shrink-0 text-muted-foreground" />
        </button>

        <h2 className="mb-3 mt-6 font-display text-sm font-bold text-foreground">
          تفضيلات التطبيق
        </h2>
        <section className="space-y-3">
          <Row
            icon={<Bell size={17} />}
            tone="bg-primary/12 text-primary"
            title="تنبيهات المتصفح"
            desc={
              permission === "granted"
                ? "مفعّلة — ستصلك التذكيرات في وقتها"
                : permission === "denied"
                  ? "محظورة من إعدادات المتصفح"
                  : "غير مفعّلة بعد"
            }
          >
            <button
              onClick={askPermission}
              disabled={permission === "granted"}
              className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
            >
              {permission === "granted" ? "مفعّلة" : "تفعيل"}
            </button>
          </Row>

          <Row
            icon={<Volume2 size={17} />}
            tone="bg-cat-social/12 text-cat-social"
            title="صوت التنبيهات"
            desc="نغمة عند انتهاء جلسة التركيز"
          >
            <Toggle
              on={profile.sound}
              onClick={() => updateProfile({ sound: !profile.sound })}
              label="تبديل صوت التنبيهات"
            />
          </Row>

          <Row
            icon={<Moon size={17} />}
            tone="bg-cat-meeting/12 text-cat-meeting"
            title="الوضع الليلي"
            desc="مظهر داكن مريح للعين"
          >
            <Toggle
              on={profile.dark}
              onClick={() => updateProfile({ dark: !profile.dark })}
              label="تبديل الوضع الليلي"
            />
          </Row>

          <Link
            to="/about"
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur-xl transition-colors hover:bg-accent/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cat-study/12 text-cat-study">
              <Info size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">عن التطبيق / من نحن</p>
              <p className="truncate text-[11px] text-muted-foreground">
                رسالة مِيعاد وقصته وتفاصيل الإصدار
              </p>
            </div>
            <ChevronLeft size={18} className="shrink-0 text-muted-foreground" />
          </Link>
        </section>

        <h2 className="mb-3 mt-6 font-display text-sm font-bold text-foreground">
          التكامل مع التطبيقات
        </h2>
        <section className="space-y-3">
          {INTEGRATIONS.map((it) => {
            const on = connected.includes(it.id);
            const Icon = it.icon;
            return (
              <Row
                key={it.id}
                icon={<Icon size={17} />}
                tone="bg-secondary text-secondary-foreground"
                title={it.label}
                desc={it.desc}
              >
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
              </Row>
            );
          })}
        </section>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <User size={12} /> صُنع بواسطة فارس
        </div>
      </div>

      {editing && (
        <ProfileModal
          profile={profile}
          onSave={updateProfile}
          onClose={() => setEditing(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
