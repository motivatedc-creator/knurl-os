import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dumbbell, Flame, Plus, TimerReset } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ExercisePicker } from "@/components/exercise-picker";
import { PlateStack } from "@/components/plates/stack";
import { Button } from "@/components/ui/button";
import { Drawer, Panel } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import type { LoadProfile } from "@/lib/domain/plates";
import { solveLoad } from "@/lib/domain/plates";
import { generateWarmup } from "@/lib/domain/warmup";
import {
  SET_CLASS_CYCLE,
  SET_CLASS_META,
  type Exercise,
  type WorkoutSet,
} from "@/lib/domain/schema";
import { findNewRecords } from "@/lib/domain/records";
import { parseDecimal, toCanonicalKg, toDisplayWeight, weightIncrement } from "@/lib/domain/units";
import { formatDuration, formatLoad, formatSet } from "@/lib/format";
import { vibrate } from "@/lib/platform/feedback";
import { useActiveWorkout, useEquipment, useExercises, useRecentExerciseIds, useTick, useVaultQuery } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { emptyDraft, restRemaining, useSessionStore } from "@/lib/store/session";
import {
  addExerciseToWorkout,
  collectRecordSets,
  finishWorkout,
  getRestTimer,
  setRestTimer,
  startBlankWorkout,
  vault,
} from "@/lib/storage/repo";
import { cn, newId, nowIso } from "@/lib/utils";

export const Route = createFileRoute("/_app/session")({
  component: SessionPage,
});

function SessionPage() {
  const workout = useActiveWorkout();
  const navigate = useNavigate();
  const [picker, setPicker] = useState(false);
  const catalog = useExercises();
  const recentIds = useRecentExerciseIds();
  const loading = workout === undefined;

  if (loading) {
    return <p className="text-sm text-steel">Loading workout…</p>;
  }

  if (!workout) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="font-display text-4xl tracking-tight">No workout yet</h1>
          <p className="mt-2 max-w-md text-sm text-steel">
            Start empty, or pick a template from Today.
          </p>
        </header>
        <Button
          size="lg"
          onClick={async () => {
            await startBlankWorkout();
          }}
          data-testid="session-start-empty"
        >
          Start empty workout
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate({ to: "/" })}>
          Back to Today
        </Button>
      </div>
    );
  }

  return (
    <LiveSession
      workoutId={workout.id}
      onAdd={() => setPicker(true)}
      picker={
        <ExercisePicker
          open={picker}
          onOpenChange={setPicker}
          exercises={catalog}
          recentIds={recentIds}
          onSelect={async (ex: Exercise) => {
            await addExerciseToWorkout(workout.id, ex);
          }}
        />
      }
    />
  );
}

function LiveSession({
  workoutId,
  onAdd,
  picker,
}: {
  workoutId: string;
  onAdd: () => void;
  picker: ReactNode;
}) {
  const workout = useVaultQuery(() => vault.getWorkout(workoutId), [workoutId]);
  const equipment = useEquipment();
  const navigate = useNavigate();
  const units = usePrefs((s) => s.units);
  const formula = usePrefs((s) => s.oneRmFormula);
  const selected = useSessionStore((s) => s.selectedExerciseId);
  const restStartedAt = useSessionStore((s) => s.restStartedAt);
  const restDurationSec = useSessionStore((s) => s.restDurationSec);
  const plateSetId = useSessionStore((s) => s.plateSetId);
  const drafts = useSessionStore((s) => s.drafts);
  const tick = useTick(true, 250);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const historySets = useVaultQuery(() => collectRecordSets(workoutId), [workoutId]) ?? [];
  const hydratedRest = useRef(false);

  useEffect(() => {
    if (!workout) return;
    if (!selected && workout.exercises[0]) {
      useSessionStore.getState().selectExercise(workout.exercises[0].id);
    }
    if (!hydratedRest.current) {
      hydratedRest.current = true;
      void getRestTimer().then((row) => {
        if (!row) return;
        useSessionStore.getState().reconstructRest(row.startedAt, row.durationSec);
      });
    }
    for (const ex of workout.exercises) {
      for (const set of ex.sets) {
        const prev = ex.previous?.[set.setIndex];
        const display =
          set.weightKg != null
            ? String(roundDisplay(toDisplayWeight(set.weightKg, units)))
            : prev?.weightKg != null
              ? String(roundDisplay(toDisplayWeight(prev.weightKg, units)))
              : "";
        useSessionStore.getState().seedDraft(set.id, {
          ...emptyDraft(),
          weight: display,
          reps: set.reps != null ? String(set.reps) : prev?.reps != null ? String(prev.reps) : "",
          rpe: set.rpe != null ? String(set.rpe) : "",
          duration: set.durationSeconds != null ? String(set.durationSeconds) : "",
        });
      }
    }
  }, [workout?.id, units, selected, workout]);

  const current = workout?.exercises.find((e) => e.id === selected) ?? workout?.exercises[0];
  const remaining = restRemaining(restStartedAt, restDurationSec, tick);
  const elapsed = workout ? Math.floor((tick - Date.parse(workout.startedAt)) / 1000) : 0;

  const loadProfile: LoadProfile | null = equipment
    ? {
        barWeightKg: equipment.bars.find((b) => b.id === equipment.activeBarId)?.weightKg ?? 20,
        collarWeightKg: equipment.collarWeightKg,
        plates: equipment.plates,
      }
    : null;

  const activeSet = current?.sets.find((s) => !s.isCompleted) ?? current?.sets.at(-1);
  const plateTarget = useMemo(() => {
    if (!activeSet) return null;
    const draft = drafts[activeSet.id];
    const display = parseDecimal(draft?.weight ?? "");
    if (display == null) return null;
    return toCanonicalKg(display, units);
  }, [activeSet, drafts, units]);

  const plateSolution =
    loadProfile && plateTarget != null ? solveLoad(plateTarget, loadProfile) : null;

  async function complete(set: WorkoutSet) {
    if (!current) return;
    const draft = useSessionStore.getState().drafts[set.id] ?? emptyDraft();
    const weightDisplay = parseDecimal(draft.weight);
    const reps = parseDecimal(draft.reps);
    const rpe = parseDecimal(draft.rpe);
    const duration = parseDecimal(draft.duration);
    if (current.snapshotTracking === "weight_reps") {
      if (weightDisplay == null || reps == null) {
        toast("Enter weight and reps first.");
        return;
      }
    }
    const stamp = nowIso();
    const nextSet: WorkoutSet = {
      ...set,
      weightKg: weightDisplay != null ? toCanonicalKg(weightDisplay, units) : set.weightKg,
      reps: reps != null ? Math.round(reps) : set.reps,
      rpe: rpe,
      durationSeconds: duration != null ? Math.round(duration) : set.durationSeconds,
      isCompleted: true,
      completedAt: stamp,
    };
    await vault.upsertSet(nextSet);
    await vault.patchWorkout({ ...(workout ?? (await vault.getWorkout(workoutId))!), updatedAt: stamp });
    const flags = findNewRecords(
      historySets,
      [
        {
          id: nextSet.id,
          exerciseId: current.exerciseId,
          weightKg: nextSet.weightKg,
          reps: nextSet.reps,
          classification: nextSet.classification,
          isCompleted: true,
          performedAt: stamp,
        },
      ],
      formula,
    );
    if (flags[0]?.kinds.length) {
      toast(`Record · ${flags[0].kinds.join(" · ")}`);
      vibrate([80, 40, 80, 40, 120]);
    }
    useSessionStore.getState().startRest(current.restSeconds, stamp);
    void setRestTimer({
      startedAt: stamp,
      endsAt: new Date(Date.parse(stamp) + current.restSeconds * 1000).toISOString(),
      durationSec: current.restSeconds,
      label: current.snapshotName,
    });
  }

  async function injectWarmup() {
    if (!current || !loadProfile) return;
    const working = current.sets.find((s) => s.classification === "working");
    const draft = working ? useSessionStore.getState().drafts[working.id] : null;
    const display = parseDecimal(draft?.weight ?? "");
    const target =
      display != null
        ? toCanonicalKg(display, units)
        : current.previous?.[0]?.weightKg ?? null;
    if (target == null) {
      toast("Set the working load first.");
      return;
    }
    const ramp = generateWarmup(target, loadProfile);
    const existingWorking = current.sets.filter((s) => s.classification !== "warmup");
    const warmupSets: WorkoutSet[] = ramp.map((step, i) => ({
      id: newId(),
      workoutExerciseId: current.id,
      setIndex: i,
      classification: "warmup",
      weightKg: step.weightKg,
      reps: step.reps,
      durationSeconds: null,
      distanceMeters: null,
      rpe: null,
      rir: null,
      completedAt: null,
      isCompleted: false,
    }));
    const shifted = existingWorking.map((s, i) => ({ ...s, setIndex: warmupSets.length + i }));
    await vault.replaceExerciseSets(current.id, [...warmupSets, ...shifted]);
    toast(`Warm-up added · ${ramp.length} sets`);
  }

  async function addWorkingSet() {
    if (!current) return;
    const next: WorkoutSet = {
      id: newId(),
      workoutExerciseId: current.id,
      setIndex: current.sets.length,
      classification: "working",
      weightKg: current.sets.at(-1)?.weightKg ?? null,
      reps: current.sets.at(-1)?.reps ?? null,
      durationSeconds: null,
      distanceMeters: null,
      rpe: null,
      rir: null,
      completedAt: null,
      isCompleted: false,
    };
    await vault.upsertSet(next);
  }

  async function onFinish() {
    await finishWorkout(workoutId);
    useSessionStore.getState().resetSessionUi();
    await setRestTimer(null);
    toast("Workout saved.");
    setConfirmFinish(false);
    navigate({ to: "/logbook/$id", params: { id: workoutId } });
  }

  if (!workout) return <p className="text-sm text-steel">Loading workout…</p>;

  return (
    <div className="flex flex-col gap-5">
      {picker}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-oxide">In progress</p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">{workout.name}</h1>
          <p className="mt-1 tabular-nums text-sm text-steel">{formatDuration(elapsed)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmFinish(true)} data-testid="finish-session">
          Finish
        </Button>
      </header>

      {workout.exercises.length === 0 ? (
        <Panel className="flex flex-col items-start gap-3">
          <p className="text-sm text-steel">No exercises yet. Add one from your library.</p>
          <Button onClick={onAdd} data-testid="add-exercise">
            <Plus className="size-4" /> Add exercise
          </Button>
        </Panel>
      ) : (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            {workout.exercises.map((ex) => {
              const done = ex.sets.filter((s) => s.isCompleted).length;
              const on = ex.id === current?.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => useSessionStore.getState().selectExercise(ex.id)}
                  className={cn(
                    "min-w-[9.5rem] rounded-lg border px-3 py-2 text-left",
                    on ? "border-oxide bg-oxide/10" : "border-hairline bg-graphite",
                  )}
                >
                  <span className="block truncate text-sm font-medium">{ex.snapshotName}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-steel">
                    {done}/{ex.sets.length}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={onAdd}
              className="grid min-w-14 place-items-center rounded-lg border border-dashed border-hairline-strong text-steel"
              aria-label="Add movement"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {current ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium">{current.snapshotName}</h2>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-steel">
                    Rest {current.restSeconds}s
                    {current.supersetId ? ` · superset ${current.supersetId}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="steel" onClick={injectWarmup} data-testid="inject-warmup">
                    <Flame className="size-3.5" /> Warm-up
                  </Button>
                  <Button
                    size="sm"
                    variant="steel"
                    onClick={() => activeSet && useSessionStore.getState().openPlates(activeSet.id)}
                    data-testid="open-plates"
                  >
                    <Dumbbell className="size-3.5" /> Plates
                  </Button>
                </div>
              </div>

              {restStartedAt ? (
                <div className="flex items-center justify-between rounded-xl border border-oxide/40 bg-oxide/10 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-oxide">{remaining > 0 ? "Rest" : "Rest done"}</p>
                    <p className="font-display text-4xl tabular-nums tracking-wide" data-testid="rest-timer">
                      {formatDuration(remaining)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        useSessionStore.getState().nudgeRest(15);
                        const next = useSessionStore.getState();
                        if (!next.restStartedAt) return;
                        void setRestTimer({
                          startedAt: next.restStartedAt,
                          endsAt: new Date(
                            Date.parse(next.restStartedAt) + next.restDurationSec * 1000,
                          ).toISOString(),
                          durationSec: next.restDurationSec,
                          label: current.snapshotName,
                        });
                      }}
                    >
                      +15
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        useSessionStore.getState().skipRest();
                        void setRestTimer(null);
                      }}
                    >
                      <TimerReset className="size-4" /> Skip
                    </Button>
                  </div>
                </div>
              ) : null}

              <ul className="flex flex-col gap-2">
                {current.sets.map((set, i) => {
                  const draft = drafts[set.id] ?? emptyDraft();
                  const prev = current.previous?.[i];
                  const prKinds =
                    set.isCompleted && set.weightKg != null && set.reps != null
                      ? findNewRecords(
                          historySets,
                          [
                            {
                              id: set.id,
                              exerciseId: current.exerciseId,
                              weightKg: set.weightKg,
                              reps: set.reps,
                              classification: set.classification,
                              isCompleted: true,
                              performedAt: set.completedAt ?? workout.startedAt,
                            },
                          ],
                          formula,
                        )[0]?.kinds
                      : undefined;
                  return (
                    <li
                      key={set.id}
                      className={cn(
                        "rounded-xl border bg-graphite p-3",
                        set.isCompleted ? "border-hairline opacity-80" : "border-hairline-strong",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-steel">
                        <button
                          type="button"
                          className="rounded-md px-2 py-1 hover:bg-elevated"
                          onClick={() => {
                            const idx = SET_CLASS_CYCLE.indexOf(set.classification);
                            const next = SET_CLASS_CYCLE[(idx + 1) % SET_CLASS_CYCLE.length]!;
                            void vault.upsertSet({ ...set, classification: next });
                          }}
                          aria-label={`Set type ${SET_CLASS_META[set.classification].label}`}
                        >
                          {SET_CLASS_META[set.classification].short || "·"} {set.classification} · set {i + 1}
                        </button>
                        <span className="flex items-center gap-2">
                          {prKinds?.length ? (
                            <span className="rounded bg-oxide/20 px-1.5 py-0.5 text-[10px] font-semibold text-oxide">
                              PR
                            </span>
                          ) : null}
                          <span>Prev {formatSet(prev?.weightKg ?? null, prev?.reps ?? null, units)}</span>
                          {prev && !set.isCompleted ? (
                            <button
                              type="button"
                              className="text-oxide"
                              onClick={() => {
                                useSessionStore.getState().setDraft(set.id, {
                                  weight:
                                    prev.weightKg != null
                                      ? String(roundDisplay(toDisplayWeight(prev.weightKg, units)))
                                      : "",
                                  reps: prev.reps != null ? String(prev.reps) : "",
                                });
                              }}
                            >
                              Copy
                            </button>
                          ) : null}
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                        <Field
                          label={units}
                          value={draft.weight}
                          onChange={(v) => useSessionStore.getState().setDraft(set.id, { weight: v })}
                          onStep={(dir) => {
                            const cur = parseDecimal(draft.weight) ?? 0;
                            const next = Math.max(0, cur + dir * weightIncrement(units));
                            useSessionStore.getState().setDraft(set.id, { weight: String(roundDisplay(next)) });
                          }}
                          testId={`weight-${i}`}
                          disabled={set.isCompleted}
                        />
                        <Field
                          label={current.snapshotTracking === "duration" ? "sec" : "reps"}
                          value={current.snapshotTracking === "duration" ? draft.duration : draft.reps}
                          onChange={(v) =>
                            useSessionStore.getState().setDraft(set.id, {
                              ...(current.snapshotTracking === "duration" ? { duration: v } : { reps: v }),
                            })
                          }
                          onStep={(dir) => {
                            const key = current.snapshotTracking === "duration" ? "duration" : "reps";
                            const cur = parseDecimal(key === "duration" ? draft.duration : draft.reps) ?? 0;
                            useSessionStore.getState().setDraft(set.id, {
                              [key]: String(Math.max(0, cur + dir)),
                            });
                          }}
                          testId={`reps-${i}`}
                          disabled={set.isCompleted}
                        />
                        <Button
                          variant={set.isCompleted ? "steel" : "oxide"}
                          size="hit"
                          disabled={set.isCompleted}
                          onClick={() => complete(set)}
                          data-testid={`complete-set-${i}`}
                        >
                          {set.isCompleted ? "Done" : "Log"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Button variant="outline" onClick={addWorkingSet}>
                Add set
              </Button>
            </section>
          ) : null}
        </>
      )}

      <Drawer
        open={Boolean(plateSetId)}
        onOpenChange={(o) => !o && useSessionStore.getState().openPlates(null)}
        title="Plate calculator"
      >
        {plateSolution ? (
          <div className="flex flex-col gap-4">
            <p className="font-display text-5xl tabular-nums tracking-wide">
              {formatLoad(plateSolution.actualKg, units)}
              <span className="ml-2 text-xl text-steel">{units}</span>
            </p>
            {!plateSolution.exact ? (
              <p className="text-sm text-oxide" data-testid="plate-delta">
                Inventory cannot hit the target. Nearest{" "}
                {formatLoad(plateSolution.actualKg, units)} {units} ({plateSolution.deltaKg.toFixed(1)} kg).
              </p>
            ) : (
              <p className="text-sm text-steel">Exact. Bar {formatLoad(plateSolution.barWeightKg, units)} {units} + collars.</p>
            )}
            <PlateStack solution={plateSolution} units={units} />
            <Button
              onClick={() => {
                if (!activeSet) return;
                const display = roundDisplay(toDisplayWeight(plateSolution.actualKg, units));
                useSessionStore.getState().setDraft(activeSet.id, { weight: String(display) });
                useSessionStore.getState().openPlates(null);
              }}
            >
              Apply plates
            </Button>
          </div>
        ) : (
          <p className="text-sm text-steel">Enter a weight to see the plate breakdown.</p>
        )}
      </Drawer>

      {confirmFinish ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-mill/70 p-4 md:place-items-center">
          <Panel className="w-full max-w-md p-5">
            <h3 className="font-display text-3xl tracking-tight">Finish workout?</h3>
            <p className="mt-2 text-sm text-steel">
              This saves it to History. Logged sets stay even if you leave some unfinished.
            </p>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" variant="oxide" onClick={onFinish} data-testid="confirm-finish">
                Finish
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setConfirmFinish(false)}>
                Keep lifting
              </Button>
            </div>
            <Button
              className="mt-2 w-full"
              variant="ghost"
              onClick={async () => {
                await vault.deleteWorkout(workoutId);
                useSessionStore.getState().resetSessionUi();
                await setRestTimer(null);
                toast("Workout discarded.");
                navigate({ to: "/" });
              }}
            >
              Discard workout
            </Button>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onStep,
  testId,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onStep: (dir: 1 | -1) => void;
  testId: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.16em] text-steel">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-md bg-elevated text-lg disabled:opacity-40"
          onClick={() => onStep(-1)}
          disabled={disabled}
        >
          −
        </button>
        <Input
          className="h-11 text-center text-lg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          disabled={disabled}
          data-testid={testId}
        />
        <button
          type="button"
          className="grid size-11 place-items-center rounded-md bg-elevated text-lg disabled:opacity-40"
          onClick={() => onStep(1)}
          disabled={disabled}
        >
          +
        </button>
      </div>
    </label>
  );
}

function roundDisplay(n: number): number {
  return Math.round(n * 4) / 4;
}

