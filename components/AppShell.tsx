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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:pb-8">
      <header className="paper-panel sticky top-3 z-20 mb-5 rounded-lg px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3" aria-label="Hinga Today">
            <span className="grid size-10 place-items-center rounded-lg bg-moss text-paper-soft">
              <ShieldCheck size={20} aria-hidden />
            </span>
            <span>
              <span className="block font-serif-display text-2xl font-semibold leading-none text-moss-deep">Hinga</span>
              <span className="text-xs text-ink-muted">{isDemo ? "Demo room" : `Private room for ${displayName}`}</span>
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
        className="paper-panel fixed inset-x-3 bottom-3 z-30 mx-auto grid max-w-xl grid-cols-5 rounded-lg p-2 backdrop-blur lg:hidden"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="grid min-h-14 place-items-center rounded-md text-xs font-semibold text-moss-deep">
              <Icon size={20} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <aside className="fixed left-6 top-32 hidden w-44 rounded-lg border border-line/70 bg-paper-soft/70 p-2 shadow-paper lg:block">
        <nav className="grid gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-moss-deep hover:bg-coral-soft/40">
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
