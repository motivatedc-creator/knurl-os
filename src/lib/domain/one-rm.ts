import type { OneRmFormula, SetClassification } from "./schema";

export type SetFor1RM = {
  weightKg: number | null;
  reps: number | null;
  classification: SetClassification;
  isCompleted: boolean;
};

/**
 * Epley: weight * (1 + reps / 30)
 * Brzycki: weight * 36 / (37 - reps), undefined for reps >= 37
 * A single is identity. Warm-up sets are ignored by the aggregator.
 */
export function estimate1RM(
  weightKg: number,
  reps: number,
  formula: OneRmFormula,
): number | null {
  if (!(weightKg > 0) || !(reps > 0) || !Number.isFinite(weightKg) || !Number.isFinite(reps)) {
    return null;
  }
  if (reps === 1) return weightKg;
  if (formula === "epley") return weightKg * (1 + reps / 30);
  if (reps >= 37) return null;
  return (weightKg * 36) / (37 - reps);
}

export function estimate1RMFromSets(
  sets: SetFor1RM[],
  formula: OneRmFormula,
): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (!set.isCompleted) continue;
    if (set.classification === "warmup") continue;
    if (set.weightKg == null || set.reps == null) continue;
    const estimate = estimate1RM(set.weightKg, set.reps, formula);
    if (estimate == null) continue;
    if (best == null || estimate > best) best = estimate;
  }
  return best;
}

export function workingSetsOnly<T extends { classification: SetClassification }>(sets: T[]): T[] {
  return sets.filter((s) => s.classification !== "warmup");
}
