import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/ui/drawer";
import { computeExerciseRecords, PR_LABEL } from "@/lib/domain/records";
import { formatClock, formatLoad, formatSet } from "@/lib/format";
import { useExercises, useVaultQuery } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { collectRecordSets, listHistoryForExercise } from "@/lib/storage/repo";
import { MUSCLE_LABEL } from "@/lib/domain/schema";

export const Route = createFileRoute("/_app/exercises_/$id")({
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { id } = Route.useParams();
  const catalog = useExercises();
  const exercise = catalog.find((e) => e.id === id);
  const units = usePrefs((s) => s.units);
  const formula = usePrefs((s) => s.oneRmFormula);
  const history = useVaultQuery(() => listHistoryForExercise(id), [id]) ?? [];
  const allSets = useVaultQuery(() => collectRecordSets(), []) ?? [];
  const records = computeExerciseRecords(
    allSets.filter((s) => s.exerciseId === id),
    formula,
  ).get(id);

  if (!exercise) return <p className="text-sm text-steel">Exercise not found.</p>;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">
          {MUSCLE_LABEL[exercise.primaryMuscleGroup]} · {exercise.equipmentType}
        </p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">{exercise.name}</h1>
        <Link to="/exercises" className="mt-2 inline-block text-sm text-steel hover:text-chalk">
          Back to exercises
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Heaviest" value={records ? `${formatLoad(records.heaviestKg, units)} ${units}` : "—"} />
        <Stat
          label="e1RM"
          value={records?.bestOneRmKg ? `${formatLoad(records.bestOneRmKg, units)} ${units}` : "—"}
        />
        <Stat
          label="Best set vol"
          value={records ? `${formatLoad(records.bestSetVolumeKg, units)} ${units}` : "—"}
        />
        <Stat label="Sessions" value={String(history.length)} />
      </div>
      {records && records.repMaxes.size ? (
        <Panel>
          <h2 className="mb-2 text-[11px] uppercase tracking-[0.2em] text-steel">{PR_LABEL.reps}</h2>
          <ul className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-5">
            {[...records.repMaxes.entries()].map(([n, kg]) => (
              <li key={n} className="rounded-md bg-elevated px-2 py-2">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-steel">{n}r</span>
                <span className="tabular-nums">
                  {formatLoad(kg, units)} {units}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <ul className="flex flex-col gap-2">
        {history.map((row) => (
          <li key={row.exercise.id}>
            <Panel className="p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-steel">
                {formatClock(row.workout.startedAt)} · {row.workout.name}
              </p>
              <ul className="mt-2 text-sm text-steel">
                {row.sets
                  .filter((s) => s.isCompleted)
                  .map((s, i) => (
                    <li key={s.id} className="tabular-nums">
                      {s.classification} {i + 1} · {formatSet(s.weightKg, s.reps, units)}
                    </li>
                  ))}
              </ul>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-steel">{label}</p>
      <p className="font-display text-2xl tabular-nums tracking-wide">{value}</p>
    </Panel>
  );
}
