import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { useTick } from "@/lib/hooks";
import { playChime, vibrate } from "@/lib/platform/feedback";
import { usePrefs } from "@/lib/store/prefs";
import { restRemaining, useSessionStore } from "@/lib/store/session";
import { getRestTimer, setRestTimer } from "@/lib/storage/repo";

export function RestClock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const restStartedAt = useSessionStore((s) => s.restStartedAt);
  const restDurationSec = useSessionStore((s) => s.restDurationSec);
  const announcedRestAt = useSessionStore((s) => s.announcedRestAt);
  const restBeep = usePrefs((s) => s.restBeep);
  const restVibrate = usePrefs((s) => s.restVibrate);
  const tick = useTick(Boolean(restStartedAt), 250);
  const remaining = restRemaining(restStartedAt, restDurationSec, tick);
  const onSession = pathname.startsWith("/session");

  useEffect(() => {
    void getRestTimer().then((row) => {
      if (!row) return;
      if (useSessionStore.getState().restStartedAt) return;
      useSessionStore.getState().reconstructRest(row.startedAt, row.durationSec);
    });
  }, []);

  useEffect(() => {
    if (!restStartedAt || remaining !== 0) return;
    if (announcedRestAt === restStartedAt) return;
    useSessionStore.getState().markAnnounced(restStartedAt);
    if (restBeep) playChime();
    if (restVibrate) vibrate();
  }, [remaining, restStartedAt, announcedRestAt, restBeep, restVibrate]);

  if (!restStartedAt || onSession) return null;

  const expired = remaining <= 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-6 md:left-[6.25rem] md:right-auto md:max-w-sm md:px-0">
      <div
        className="pointer-events-auto overflow-hidden rounded-xl border border-oxide/40 bg-graphite shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        data-testid="global-rest"
      >
        <div
          className="h-1 bg-oxide transition-[width] duration-200"
          style={{
            width: expired
              ? "100%"
              : `${Math.min(100, Math.round(((restDurationSec - remaining) / Math.max(1, restDurationSec)) * 100))}%`,
          }}
        />
        <div className="flex items-center gap-2 px-3 py-2">
          <Link to="/session" className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-oxide">
              {expired ? "Rest closed" : "Rest"}
            </p>
            <p className="font-display text-3xl tabular-nums tracking-wide">
              {formatDuration(remaining)}
            </p>
          </Link>
          <Button
            size="sm"
            variant="steel"
            onClick={() => {
              useSessionStore.getState().nudgeRest(15);
              persist();
            }}
          >
            +15
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              useSessionStore.getState().skipRest();
              void setRestTimer(null);
            }}
          >
            {expired ? "Done" : "Skip"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function persist() {
  const { restStartedAt, restDurationSec } = useSessionStore.getState();
  if (!restStartedAt) {
    void setRestTimer(null);
    return;
  }
  void setRestTimer({
    startedAt: restStartedAt,
    endsAt: new Date(Date.parse(restStartedAt) + restDurationSec * 1000).toISOString(),
    durationSec: restDurationSec,
    label: "rest",
  });
}
