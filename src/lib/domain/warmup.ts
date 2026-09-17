import { loadStepKg, solveLoad, type LoadProfile, type LoadSolution } from "./plates";

export type WarmupStep = {
  percent: number | null;
  reps: number;
  weightKg: number;
  solution: LoadSolution;
};

const RAMP: { percent: number | null; reps: number; heavyOnly?: boolean }[] = [
  { percent: null, reps: 8 },
  { percent: 0.5, reps: 5 },
  { percent: 0.7, reps: 3 },
  { percent: 0.85, reps: 2 },
  { percent: 0.9, reps: 1, heavyOnly: true },
];

const HEAVY_THRESHOLD_KG = 80;

/**
 * Ramp generator. Loads are rounded to inventory (closest lower), strictly
 * monotonic, de-duplicated, and always below the working set.
 */
export function generateWarmup(
  workingKg: number,
  profile: LoadProfile,
  options?: { heavyThresholdKg?: number },
): WarmupStep[] {
  const heavyThreshold = options?.heavyThresholdKg ?? HEAVY_THRESHOLD_KG;
  const barKg = profile.barWeightKg;
  const step = loadStepKg(profile.plates);
  if (!(workingKg > barKg)) return [];

  const steps: WarmupStep[] = [];
  let lastKg = -1;

  for (const rung of RAMP) {
    if (rung.heavyOnly && workingKg < heavyThreshold) continue;

    const raw = rung.percent == null ? barKg : rung.percent * workingKg;
    const capped = Math.min(raw, workingKg - step);
    if (capped < barKg - 1e-6) continue;

    const solution =
      rung.percent == null
        ? {
            ...solveLoad(barKg, { ...profile, collarWeightKg: 0 }),
            collarWeightKg: 0,
            barWeightKg: barKg,
            baseKg: barKg,
            targetKg: barKg,
            actualKg: barKg,
            exact: true,
            deltaKg: 0,
            perSide: [],
            totalPlates: 0,
          }
        : solveLoad(capped, profile);

    const load = rung.percent == null ? barKg : solution.actualKg;
    if (load >= workingKg - 1e-6) continue;
    if (Math.abs(load - lastKg) < 1e-4) continue;
    if (load + 1e-6 < lastKg) continue;

    steps.push({
      percent: rung.percent,
      reps: rung.reps,
      weightKg: load,
      solution: { ...solution, actualKg: load, targetKg: raw },
    });
    lastKg = load;
  }

  return steps;
}
