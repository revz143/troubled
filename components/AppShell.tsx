import Link from "next/link";
import { Banknote, CalendarDays, ChartNoAxesCombined, HandCoins, Settings, ShieldCheck } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const navItems = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/forecast", label: "Forecast", icon: ChartNoAxesCombined },
  { href: "/plan", label: "Plan", icon: Banknote },
  { href: "/income", label: "Income", icon: HandCoins },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  displayName,
  isDemo,
}: {
  children: React.ReactNode;
  displayName: string;
  isDemo: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-28 pt-5 sm:px-7 lg:pb-10">
      <header className="sticky top-0 z-20 mb-7 border-b border-line/80 bg-paper/90 px-1 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3" aria-label="Hinga Today">
            <span className="grid size-10 place-items-center rounded-[10px] border border-line/80 bg-paper-raised text-moss">
              <ShieldCheck size={20} aria-hidden />
            </span>
            <span>
              <span className="block font-serif-display text-[28px] font-light leading-none text-moss-deep">Hinga</span>
              <span className="mono-label">{isDemo ? "Demo room" : `Private room · ${displayName}`}</span>
            </span>
          </Link>
          <form action={signOut}>
            <button className="btn btn-secondary hidden sm:inline-flex" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <nav
        className="fixed inset-x-3 bottom-3 z-30 mx-auto grid max-w-xl grid-cols-5 rounded-[22px] border border-line/80 bg-paper-chrome/95 p-2 shadow-sheet backdrop-blur lg:hidden"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="grid min-h-14 place-items-center rounded-[10px] text-[12.5px] font-medium text-ink-muted hover:bg-paper-sunk">
              <Icon size={20} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <aside className="fixed left-6 top-32 hidden w-44 border-y border-line/80 bg-paper/75 py-2 lg:block">
        <nav className="grid gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium text-ink-muted hover:bg-paper-sunk hover:text-ink">
                <Icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
