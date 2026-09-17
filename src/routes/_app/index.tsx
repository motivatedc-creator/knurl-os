import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play, Plus } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/drawer";
import { brand } from "@/lib/brand/tokens";
import { formatLoad, formatClock } from "@/lib/format";
import { useActiveWorkout, useMounted, useTemplates, useVaultQuery, useWorkouts } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { startBlankWorkout, startFromTemplate } from "@/lib/storage/repo";
import { loadDashboardStats } from "@/lib/storage/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: TodayPage,
});

function TodayPage() {
  const navigate = useNavigate();
  const templates = useTemplates();
  const workouts = useWorkouts();
  const units = usePrefs((s) => s.units);
  const onboardingDone = usePrefs((s) => s.onboardingDone);
  const restBeep = usePrefs((s) => s.restBeep);
  const hydrated = usePrefs((s) => s.hydrated);
  const updatePrefs = usePrefs((s) => s.update);
  const mounted = useMounted();
  const stats = useVaultQuery(() => loadDashboardStats());
  const active = useActiveWorkout();
  const recent = workouts.filter((w) => w.status === "completed").slice(0, 5);
  const delta =
    stats && stats.prevWeekVolumeKg > 0
      ? ((stats.weekVolumeKg - stats.prevWeekVolumeKg) / stats.prevWeekVolumeKg) * 100
      : null;
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  async function emptySession() {
    await startBlankWorkout();
    navigate({ to: "/session" });
  }

  async function fromTemplate(id: string) {
    await startFromTemplate(id);
    navigate({ to: "/session" });
  }

  if (hydrated && !onboardingDone) {
    return (
      <div className="flex flex-col gap-6" data-testid="onboarding">
        <PageHeader title="Welcome to Knurl" subtitle="A simple lifting log that stays on this phone. Nothing is uploaded." />
        <Panel className="flex flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-medium">How should weights look?</p>
            <p className="mt-1 text-sm text-steel">You can switch later in More → Settings.</p>
          </div>
          <div className="flex gap-2">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => updatePrefs({ units: u })}
                className={cn(
                  "h-12 flex-1 rounded-md text-sm font-medium",
                  units === u ? "bg-chalk text-mill" : "bg-elevated text-steel",
                )}
              >
                {u === "kg" ? "Kilograms" : "Pounds"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => updatePrefs({ restBeep: !restBeep })}
            className={cn(
              "h-12 rounded-md text-sm font-medium",
              restBeep ? "bg-chalk text-mill" : "bg-elevated text-steel",
            )}
          >
            Rest timer sound: {restBeep ? "On" : "Off"}
          </button>
          <Button size="lg" onClick={() => updatePrefs({ onboardingDone: true })} data-testid="onboarding-done">
            Let’s go
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Today" subtitle={today} />

      {active ? (
        <button
          type="button"
          onClick={() => navigate({ to: "/session" })}
          className="flex items-center justify-between rounded-xl border border-oxide/40 bg-oxide/10 px-4 py-4 text-left"
          data-testid="resume-session"
        >
          <span>
            <span className="block text-xs font-semibold text-oxide">Workout in progress</span>
            <span className="text-lg font-medium">{active.name}</span>
          </span>
          <span className="flex items-center gap-2 text-sm font-medium text-oxide">
            Resume <Play className="size-4" />
          </span>
        </button>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" onClick={emptySession} data-testid="start-empty">
          <Plus className="size-4" />
          Start empty workout
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate({ to: "/routines" })}>
          Edit templates
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={stats ? `${stats.streak}d` : "—"} />
        <Stat label="This week" value={stats ? String(stats.sessionsThisWeek) : "—"} />
        <Stat
          label="Volume"
          value={stats ? formatLoad(stats.weekVolumeKg, units) : "—"}
          hint={delta == null ? "vs last week" : `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`}
        />
      </div>

      <Panel className="p-4">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">Last 7 days</h2>
          <span className="text-xs text-steel">{units}</span>
        </div>
        <div className="h-36">
          {mounted && stats ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.series} barCategoryGap={10}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: brand.steel, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(232,226,212,0.04)" }}
                  contentStyle={{
                    background: brand.graphite,
                    border: `1px solid ${brand.hairline}`,
                    borderRadius: 6,
                    color: brand.chalk,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value} kg`, "Volume"]}
                />
                <Bar dataKey="kg" fill={brand.chalk} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-md bg-elevated" />
          )}
        </div>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Start a template</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <li key={t.id}>
              <Panel className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-steel">
                    {t.exercises.length} exercise{t.exercises.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="oxide"
                  onClick={() => fromTemplate(t.id)}
                  data-testid={`launch-${t.name}`}
                >
                  Start
                </Button>
              </Panel>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Recent workouts</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-steel">No workouts yet. Start a template above.</p>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">
            {recent.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center justify-between px-4 py-3 text-left hover:bg-elevated"
                  onClick={() => navigate({ to: "/logbook/$id", params: { id: w.id } })}
                >
                  <span>
                    <span className="block font-medium">{w.name}</span>
                    <span className="text-xs text-steel">
                      {formatClock(w.completedAt ?? w.startedAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel className="px-3 py-3">
      <p className="text-xs text-steel">{label}</p>
      <p className="font-display text-3xl tabular-nums tracking-tight">{value}</p>
      {hint ? <p className={cn("text-xs text-steel")}>{hint}</p> : null}
    </Panel>
  );
}
