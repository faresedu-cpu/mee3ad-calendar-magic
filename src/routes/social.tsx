import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, Plus, Share2, Trash2, Users } from "lucide-react";
import { DAYS_SHORT, dateKey } from "@/lib/events";
import { BottomNav } from "@/components/mee3ad/bottom-nav";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "الطلعات والتجمعات | مِيعاد" },
      {
        name: "description",
        content:
          "أنشئ استطلاع «متى تفضّون؟» وشاركه مع الأصدقاء والعائلة للتصويت على أنسب وقت للقاء.",
      },
      { property: "og:title", content: "الطلعات والتجمعات | مِيعاد" },
      {
        property: "og:description",
        content: "تنسيق مواعيد اللقاءات الجماعية بخطوات بسيطة داخل مِيعاد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SocialPage,
});

type Slot = { id: string; date: string; time: string; votes: number };
type Poll = { id: string; title: string; slots: Slot[]; createdAt: number };

const POLLS_KEY = "mee3ad-polls";

function SocialPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dateKey(new Date()));
  const [time, setTime] = useState("19:00");
  const [draftSlots, setDraftSlots] = useState<Omit<Slot, "votes">[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POLLS_KEY);
      if (raw) setPolls(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
  }, [polls, loaded]);

  const addSlot = () => {
    setDraftSlots((s) => [...s, { id: crypto.randomUUID(), date, time }]);
  };

  const createPoll = () => {
    if (!title.trim() || draftSlots.length === 0) return;
    setPolls((p) => [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        slots: draftSlots.map((s) => ({ ...s, votes: 0 })),
        createdAt: Date.now(),
      },
      ...p,
    ]);
    setTitle("");
    setDraftSlots([]);
  };

  const vote = (pollId: string, slotId: string) =>
    setPolls((p) =>
      p.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              slots: poll.slots.map((s) => (s.id === slotId ? { ...s, votes: s.votes + 1 } : s)),
            }
          : poll,
      ),
    );

  const share = async (poll: Poll) => {
    const url = `${window.location.origin}/social#poll-${poll.id}`;
    try {
      await navigator.clipboard.writeText(`${poll.title} — صوّت على الوقت المناسب: ${url}`);
      setCopied(poll.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const slotLabel = (s: { date: string; time: string }) => {
    const [y, m, d] = s.date.split("-").map(Number);
    const dt = new Date(y!, m! - 1, d!);
    return `${DAYS_SHORT[dt.getDay()]} ${d}/${m} • ${s.time}`;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 font-body">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <header className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cat-social/12 text-cat-social">
            <Users size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-foreground">
              الطلعات والتجمعات
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              نسّق وقت اللقاء مع أصدقائك بسهولة
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <h2 className="font-display text-sm font-bold text-foreground">متى تفضّون؟</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            أضف عنوان اللقاء وعدة أوقات مقترحة، ثم شارك الرابط للتصويت.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: قهوة مع الشباب"
            className="mt-3 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          />

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-w-0 rounded-2xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-2xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={addSlot}
              aria-label="إضافة وقت مقترح"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-background text-foreground transition-colors hover:bg-accent"
            >
              <Plus size={16} />
            </button>
          </div>

          {draftSlots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {draftSlots.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold text-secondary-foreground"
                >
                  {slotLabel(s)}
                  <button
                    onClick={() => setDraftSlots((d) => d.filter((x) => x.id !== s.id))}
                    aria-label="حذف"
                    className="text-destructive"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            onClick={createPoll}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={!title.trim() || draftSlots.length === 0}
          >
            <Share2 size={15} /> إنشاء الاستطلاع
          </button>
        </section>

        <section className="mt-4 space-y-3">
          <h2 className="font-display text-sm font-bold text-foreground">استطلاعاتك</h2>
          {polls.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              لا توجد استطلاعات بعد — أنشئ أول لقاء جماعي!
            </p>
          ) : (
            polls.map((poll) => {
              const top = Math.max(...poll.slots.map((s) => s.votes), 0);
              return (
                <article
                  key={poll.id}
                  id={`poll-${poll.id}`}
                  className="rounded-3xl border border-border bg-card p-4 shadow-soft"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <h3 className="truncate font-display text-sm font-bold text-foreground">
                      {poll.title}
                    </h3>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => share(poll)}
                        aria-label="نسخ رابط المشاركة"
                        className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
                      >
                        {copied === poll.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => setPolls((p) => p.filter((x) => x.id !== poll.id))}
                        aria-label="حذف الاستطلاع"
                        className="grid h-8 w-8 place-items-center rounded-xl text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {poll.slots.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => vote(poll.id, s.id)}
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 text-right transition-colors hover:bg-accent"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-foreground">
                            {slotLabel(s)}
                          </span>
                          <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <span
                              className="block h-full rounded-full bg-cat-social"
                              style={{ width: `${top ? (s.votes / top) * 100 : 0}%` }}
                            />
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-cat-social/12 px-2.5 py-1 text-[11px] font-bold text-cat-social">
                          {s.votes} صوت
                        </span>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
