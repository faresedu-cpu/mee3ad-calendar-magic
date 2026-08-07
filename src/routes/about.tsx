import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarHeart, HeartHandshake, Sparkles, Target } from "lucide-react";
import { BottomNav } from "@/components/mee3ad/bottom-nav";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | مِيعاد" },
      {
        name: "description",
        content:
          "قصة مِيعاد ورسالته: منصة عربية موحّدة لتنظيم المواعيد والدراسة واللقاءات بواجهة بسيطة تدعم RTL.",
      },
      { property: "og:title", content: "من نحن | مِيعاد" },
      {
        property: "og:description",
        content: "تعرّف على رسالة مِيعاد وقصته وتفاصيل الإصدار الحالي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const PILLARS = [
  {
    icon: Target,
    title: "رسالتنا",
    text: "أن يجد كل مستخدم عربي مكاناً واحداً يجمع مواعيده ودراسته ولقاءاته بلغته وبتصميم يحترم وقته.",
  },
  {
    icon: CalendarHeart,
    title: "قصتنا",
    text: "بدأ مِيعاد كفكرة بسيطة: تقويم عربي يفهم يومك، ثم تطوّر إلى منصة تضم التذكيرات الذكية ومساحة الدراسة وتنسيق اللقاءات.",
  },
  {
    icon: Bell,
    title: "ما يميزنا",
    text: "تذكيرات متعددة من 5 دقائق إلى أسبوع كامل، تصنيفات بصرية للمواعيد، ومؤقت تركيز مدمج مع تحليلات أسبوعية.",
  },
  {
    icon: HeartHandshake,
    title: "خصوصيتك أولاً",
    text: "كل بياناتك محفوظة داخل متصفحك فقط، بدون حسابات أو خوادم خارجية.",
  },
];

function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold text-foreground hover:bg-accent"
        >
          <ArrowRight size={13} /> رجوع للإعدادات
        </Link>

        <header className="rounded-3xl border border-border bg-card/70 p-6 text-center shadow-soft backdrop-blur-xl">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground">
            <Sparkles size={26} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">
            مِيعاد — تقويمك العربي الذكي
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            منصة واحدة تجمع مواعيدك، واجباتك، وجلسات تركيزك، ولقاءاتك مع من تحب — بواجهة عربية
            كاملة من اليمين إلى اليسار.
          </p>
        </header>

        <section className="mt-4 space-y-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <article
                key={p.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-bold text-foreground">{p.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
          <h2 className="font-display text-sm font-bold text-foreground">تفاصيل الإصدار</h2>
          <dl className="mt-3 space-y-2 text-xs">
            {[
              ["اسم التطبيق", "مِيعاد"],
              ["الإصدار الحالي", "2.0"],
              ["تاريخ الإطلاق", "2026"],
              ["اللغة", "العربية (RTL)"],
              ["التطوير", "فارس"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-bold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">صُنع بواسطة فارس</p>
      </div>

      <BottomNav />
    </div>
  );
}
