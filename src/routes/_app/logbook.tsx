import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { formatClock, formatDuration } from "@/lib/format";
import { useWorkouts } from "@/lib/hooks";

export const Route = createFileRoute("/_app/logbook")({
  component: LogbookPage,
});

function LogbookPage() {
  const workouts = useWorkouts();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const completed = workouts.filter((w) => w.status !== "discarded");
    const needle = q.trim().toLowerCase();
    if (!needle) return completed;
    return completed.filter((w) => w.name.toLowerCase().includes(needle));
  }, [workouts, q]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="History" subtitle="Every finished workout on this device." />
      <Input
        placeholder="Search workouts"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        data-testid="log-search"
      />
      {rows.length === 0 ? (
        <p className="text-sm text-steel">No workouts yet. Start one from Today.</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {rows.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className="flex min-h-16 w-full items-center justify-between px-4 py-3 text-left hover:bg-elevated"
                onClick={() => navigate({ to: "/logbook/$id", params: { id: w.id } })}
              >
                <span>
                  <span className="block font-medium">{w.name}</span>
                  <span className="text-[11px] text-steel">
                    {formatClock(w.completedAt ?? w.startedAt)}
                    {w.status === "active" ? " · live" : ""}
                  </span>
                </span>
                <span className="tabular-nums text-sm text-steel">
                  {formatDuration(w.durationSeconds)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
