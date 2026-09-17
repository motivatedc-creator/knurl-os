import { Link, useRouterState } from "@tanstack/react-router";
import { BookMarked, Hexagon, LineChart, Settings2, Timer } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { KnurlMark, KnurlWordmark } from "@/components/brand/mark";
import { usePrefs } from "@/lib/store/prefs";
import { useActiveWorkout } from "@/lib/hooks";
import { isVaultAvailable } from "@/lib/storage/db";
import { vault } from "@/lib/storage/repo";
import { openVault } from "@/lib/storage/seed";
import { RestClock } from "@/components/rest-clock";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { brand } from "@/lib/brand/tokens";

const NAV = [
  { to: "/", label: "Command", icon: Hexagon },
  { to: "/session", label: "Session", icon: Timer },
  { to: "/logbook", label: "Log", icon: BookMarked },
  { to: "/analytics", label: "Charts", icon: LineChart },
  { to: "/system", label: "System", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const icon = usePrefs((s) => s.appIcon);
  const theme = usePrefs((s) => s.theme);
  const active = useActiveWorkout();

  useEffect(() => {
    if (!isVaultAvailable()) return;
    void openVault()
      .then(() => vault.getPrefs())
      .then((p) => usePrefs.getState().hydrate(p));
  }, []);

  return (
    <div className="min-h-dvh bg-mill text-chalk">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[5.5rem] flex-col border-r border-hairline bg-graphite md:flex">
        <Link to="/" className="grid place-items-center py-5" aria-label="Knurl OS">
          <KnurlMark size={36} variant={icon} />
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV.map((item) => {
            const on =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg py-3 text-[10px] uppercase tracking-[0.16em] text-steel hover:bg-elevated hover:text-chalk",
                  on && "bg-elevated text-chalk",
                )}
              >
                {on && <span className="absolute top-2 left-0 h-8 w-0.5 bg-oxide" />}
                <item.icon className="size-5" strokeWidth={1.6} />
                {item.label}
                {item.to === "/session" && active ? (
                  <span className="absolute top-2 right-2 size-1.5 rounded-full bg-oxide" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-mill/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <Link to="/" className="flex items-center gap-3">
          <KnurlMark size={28} variant={icon} />
          <KnurlWordmark />
        </Link>
        {active ? (
          <Link
            to="/session"
            className="text-[10px] uppercase tracking-[0.2em] text-oxide"
            data-testid="resume-chip"
          >
            Live
          </Link>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.2em] text-steel">Local</span>
        )}
      </header>

      <div className="md:pl-[5.5rem]">
        <div className="hidden items-center justify-between border-b border-hairline px-8 py-4 md:flex">
          <KnurlWordmark />
          <p className="text-[10px] uppercase tracking-[0.28em] text-steel">
            {theme === "mill" ? "Mill scale" : "Chalk"} · local vault
          </p>
        </div>
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-graphite/95 backdrop-blur-sm md:hidden">
        <ul className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const on =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.14em] text-steel",
                    on && "text-chalk",
                  )}
                >
                  <item.icon className="size-5" strokeWidth={1.6} />
                  {item.label}
                  {item.to === "/session" && active ? (
                    <span className="absolute top-2 right-[calc(50%-18px)] size-1.5 rounded-full bg-oxide" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: brand.graphite,
            color: brand.chalk,
            border: `1px solid ${brand.hairline}`,
            fontFamily: "Archivo, sans-serif",
          },
        }}
      />
      <RestClock />
    </div>
  );
}
