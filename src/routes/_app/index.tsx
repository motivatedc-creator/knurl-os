import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play, Plus } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
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
  component: CommandCenter,
});

function CommandCenter() {
  const navigate = useNavigate();
  const templates = useTemplates();
  const workouts = useWorkouts();
  const units = usePrefs((s) => s.units);
  const mounted = useMounted();
  const stats = useVaultQuery(() => loadDashboardStats());
  const active = useActiveWorkout();
  const recent = workouts.filter((w) => w.status === "completed").slice(0, 5);
  const delta =
    stats && stats.prevWeekVolumeKg > 0
      ? ((stats.weekVolumeKg - stats.prevWeekVolumeKg) / stats.prevWeekVolumeKg) * 100
      : null;

  async function emptySession() {
    await startBlankWorkout();
    navigate({ to: "/session" });
  }

  async function fromTemplate(id: string) {
    await startFromTemplate(id);
    navigate({ to: "/session" });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Command</p>
        <h1 className="font-display text-5xl tracking-[0.08em] md:text-6xl">FLOOR</h1>
        <p className="max-w-md text-sm text-steel">
          Local vault. No account. Load is stored on this device.
        </p>
      </header>

      {active ? (
        <button
          type="button"
          onClick={() => navigate({ to: "/session" })}
          className="flex items-center justify-between rounded-xl border border-oxide/40 bg-oxide/10 px-4 py-4 text-left"
          data-testid="resume-session"
        >
          <span>
            <span className="block text-[11px] uppercase tracking-[0.22em] text-oxide">Session live</span>
            <span className="text-lg font-medium">{active.name}</span>
          </span>
          <Play className="size-5 text-oxide" />
        </button>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" onClick={emptySession} data-testid="start-empty">
          <Plus className="size-4" />
          Empty session
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate({ to: "/routines" })}>
          Manage routines
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={stats ? `${stats.streak}d` : "—"} />
        <Stat label="This week" value={stats ? String(stats.sessionsThisWeek) : "—"} />
        <Stat
          label="Tonnage"
          value={stats ? formatLoad(stats.weekVolumeKg, units) : "—"}
          hint={delta == null ? "no prior week" : `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`}
        />
      </div>

      <Panel className="p-4">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-steel">Seven-day tonnage</h2>
          <span className="text-[11px] text-steel">{units}</span>
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
                  formatter={(value) => [`${value} kg`, "Tonnage"]}
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
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-steel">Routines</h2>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <li key={t.id}>
              <Panel className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-steel">
                    {t.exercises.length} movements
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="oxide"
                  onClick={() => fromTemplate(t.id)}
                  data-testid={`launch-${t.name}`}
                >
                  Launch
                </Button>
              </Panel>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-steel">Recent</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-steel">No completed sessions on this device.</p>
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
                    <span className="text-[11px] text-steel">
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
      <p className="text-[10px] uppercase tracking-[0.18em] text-steel">{label}</p>
      <p className="font-display text-3xl tabular-nums tracking-wide">{value}</p>
      {hint ? <p className={cn("text-[11px] text-steel")}>{hint}</p> : null}
    </Panel>
  );
}
