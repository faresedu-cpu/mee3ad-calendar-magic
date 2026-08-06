import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, Settings, Users } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/calendar", label: "التقويم", icon: CalendarDays },
  { to: "/social", label: "الطلعات", icon: Users },
  { to: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <nav
      dir="rtl"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`grid h-9 w-14 place-items-center rounded-2xl transition-all ${
                    active ? "bg-primary/12" : ""
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
