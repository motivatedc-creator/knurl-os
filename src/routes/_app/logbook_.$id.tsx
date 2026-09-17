import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/drawer";
import { formatClock, formatDuration, formatLoad } from "@/lib/format";
import { useVaultQuery } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { vault } from "@/lib/storage/repo";
import { parseDecimal, toCanonicalKg, toDisplayWeight } from "@/lib/domain/units";
import { nowIso } from "@/lib/utils";

export const Route = createFileRoute("/_app/logbook_/$id")({
  component: WorkoutDetail,
});

function WorkoutDetail() {
  const { id } = Route.useParams();
  const workout = useVaultQuery(() => vault.getWorkout(id), [id]);
  const units = usePrefs((s) => s.units);
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Record<string, { w: string; r: string }>>({});

  if (workout === undefined) return <p className="text-sm text-steel">Reading ledger…</p>;
  if (!workout) return <p className="text-sm text-steel">Session missing.</p>;

  async function saveSet(setId: string, exerciseId: string) {
    const draft = editing[setId];
    const set = workout!.exercises.find((e) => e.id === exerciseId)?.sets.find((s) => s.id === setId);
    if (!set || !draft) return;
    const w = parseDecimal(draft.w);
    const r = parseDecimal(draft.r);
    await vault.upsertSet({
      ...set,
      weightKg: w != null ? toCanonicalKg(w, units) : set.weightKg,
      reps: r != null ? Math.round(r) : set.reps,
    });
    await vault.patchWorkout({ ...workout!, updatedAt: nowIso() });
    toast("Set rewritten. Analytics recompute on read.");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-steel">
            {workout.status === "active" ? "Live" : "Closed"}
          </p>
          <h1 className="font-display text-4xl tracking-[0.08em]">{workout.name}</h1>
          <p className="mt-1 text-sm text-steel">
            {formatClock(workout.startedAt)} · {formatDuration(workout.durationSeconds)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await vault.deleteWorkout(id);
            navigate({ to: "/logbook" });
          }}
        >
          Delete
        </Button>
      </header>
      {workout.exercises.map((ex) => (
        <Panel key={ex.id} className="p-4">
          <h2 className="font-medium">{ex.snapshotName}</h2>
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-steel">
            {ex.snapshotPrimary.replace("_", " ")}
          </p>
          <ul className="flex flex-col gap-2">
            {ex.sets.map((set, i) => {
              const draft = editing[set.id] ?? {
                w: set.weightKg != null ? String(Number(toDisplayWeight(set.weightKg, units).toFixed(2))) : "",
                r: set.reps != null ? String(set.reps) : "",
              };
              return (
                <li key={set.id} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
                  <span className="w-14 text-[10px] uppercase tracking-[0.12em] text-steel">
                    {set.classification[0]}{i + 1}
                  </span>
                  <Input
                    value={draft.w}
                    onChange={(e) => setEditing((p) => ({ ...p, [set.id]: { ...draft, w: e.target.value } }))}
                  />
                  <Input
                    value={draft.r}
                    onChange={(e) => setEditing((p) => ({ ...p, [set.id]: { ...draft, r: e.target.value } }))}
                  />
                  <Button size="sm" variant="steel" onClick={() => saveSet(set.id, ex.id)}>
                    Write
                  </Button>
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
      <p className="text-[11px] text-steel">
        Stored canonical kg. Display {units}. Last load shown as {formatLoad(workout.exercises[0]?.sets[0]?.weightKg ?? null, units)} {units}.
      </p>
    </div>
  );
}
