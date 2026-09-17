import { estimate1RM } from "./one-rm";
import type { OneRmFormula, SetClassification } from "./schema";

export const REP_BRACKETS = [1, 2, 3, 5, 8, 10, 12, 15, 20] as const;
export type RepBracket = (typeof REP_BRACKETS)[number];

export type RecordSet = {
  id: string;
  exerciseId: string;
  weightKg: number | null;
  reps: number | null;
  classification: SetClassification;
  isCompleted: boolean;
  performedAt: string;
};

export type ExerciseRecords = {
  exerciseId: string;
  heaviestKg: number;
  bestOneRmKg: number;
  bestSetVolumeKg: number;
  repMaxes: Map<RepBracket, number>;
};

export type PrKind = "weight" | "oneRm" | "volume" | "reps";

export const PR_LABEL: Record<PrKind, string> = {
  weight: "Heaviest load",
  oneRm: "Best estimated 1RM",
  volume: "Best set volume",
  reps: "Rep record",
};

function eligible(set: RecordSet): boolean {
  return (
    set.isCompleted &&
    set.classification !== "warmup" &&
    set.weightKg != null &&
    set.weightKg > 0 &&
    set.reps != null &&
    set.reps > 0
  );
}

export function computeExerciseRecords(
  sets: readonly RecordSet[],
  formula: OneRmFormula,
): Map<string, ExerciseRecords> {
  const byExercise = new Map<string, ExerciseRecords>();

  for (const set of sets) {
    if (!eligible(set) || set.weightKg == null || set.reps == null) continue;
    const weight = set.weightKg;
    const reps = set.reps;
    const record =
      byExercise.get(set.exerciseId) ??
      ({
        exerciseId: set.exerciseId,
        heaviestKg: 0,
        bestOneRmKg: 0,
        bestSetVolumeKg: 0,
        repMaxes: new Map(),
      } satisfies ExerciseRecords);

    record.heaviestKg = Math.max(record.heaviestKg, weight);
    const estimate = estimate1RM(weight, reps, formula);
    if (estimate != null) record.bestOneRmKg = Math.max(record.bestOneRmKg, estimate);
    record.bestSetVolumeKg = Math.max(record.bestSetVolumeKg, weight * reps);
    for (const bracket of REP_BRACKETS) {
      if (reps < bracket) continue;
      const existing = record.repMaxes.get(bracket) ?? 0;
      if (weight > existing) record.repMaxes.set(bracket, weight);
    }
    byExercise.set(set.exerciseId, record);
  }

  return byExercise;
}

export type PrFlag = { setId: string; exerciseId: string; kinds: PrKind[] };

export function findNewRecords(
  history: readonly RecordSet[],
  candidates: readonly RecordSet[],
  formula: OneRmFormula,
): PrFlag[] {
  const baseline = computeExerciseRecords(history, formula);
  const flags: PrFlag[] = [];
  const ordered = [...candidates].sort((a, b) => a.performedAt.localeCompare(b.performedAt));
  const running = new Map<string, { weight: number; oneRm: number; volume: number }>();

  for (const set of ordered) {
    if (!eligible(set) || set.weightKg == null || set.reps == null) continue;
    const weight = set.weightKg;
    const reps = set.reps;
    const base = baseline.get(set.exerciseId);
    const live = running.get(set.exerciseId) ?? { weight: 0, oneRm: 0, volume: 0 };
    const kinds: PrKind[] = [];

    const bestWeight = Math.max(base?.heaviestKg ?? 0, live.weight);
    if (weight > bestWeight) kinds.push("weight");

    const estimate = estimate1RM(weight, reps, formula);
    const bestOneRm = Math.max(base?.bestOneRmKg ?? 0, live.oneRm);
    if (estimate != null && estimate > bestOneRm) kinds.push("oneRm");

    const volume = weight * reps;
    const bestVolume = Math.max(base?.bestSetVolumeKg ?? 0, live.volume);
    if (volume > bestVolume) kinds.push("volume");

    const bracket = [...REP_BRACKETS].reverse().find((b) => reps >= b);
    if (bracket) {
      const existing = base?.repMaxes.get(bracket) ?? 0;
      if (weight > existing && !kinds.includes("weight")) kinds.push("reps");
    }

    running.set(set.exerciseId, {
      weight: Math.max(bestWeight, weight),
      oneRm: Math.max(bestOneRm, estimate ?? 0),
      volume: Math.max(bestVolume, volume),
    });

    if (kinds.length) flags.push({ setId: set.id, exerciseId: set.exerciseId, kinds });
  }

  return flags;
}
