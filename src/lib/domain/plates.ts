export type PlateStock = { denominationKg: number; count: number };

export type LoadProfile = {
  barWeightKg: number;
  collarWeightKg: number;
  plates: PlateStock[];
};

export type PlateOnSide = { denominationKg: number; count: number };

export type LoadSolution = {
  targetKg: number;
  actualKg: number;
  exact: boolean;
  deltaKg: number;
  barWeightKg: number;
  collarWeightKg: number;
  perSide: PlateOnSide[];
  totalPlates: number;
  baseKg: number;
};

function toG(kg: number): number {
  return Math.round(kg * 1000);
}

function toKg(g: number): number {
  return g / 1000;
}

export function smallestPlateKg(plates: PlateStock[]): number {
  const usable = plates.filter((p) => p.count >= 2 && p.denominationKg > 0);
  if (!usable.length) return 1.25;
  return Math.min(...usable.map((p) => p.denominationKg));
}

export function loadStepKg(plates: PlateStock[]): number {
  return smallestPlateKg(plates) * 2;
}

function greedyPerSideGrams(
  targetG: number,
  plates: PlateStock[],
): PlateOnSide[] | null {
  const sorted = [...plates]
    .filter((p) => p.denominationKg > 0 && p.count >= 2)
    .sort((a, b) => b.denominationKg - a.denominationKg);

  let remaining = targetG;
  const result: PlateOnSide[] = [];

  for (const plate of sorted) {
    const denomG = toG(plate.denominationKg);
    if (denomG <= 0) continue;
    const maxN = Math.floor(plate.count / 2);
    const n = Math.min(maxN, Math.floor((remaining + 0.5) / denomG));
    if (n > 0) {
      result.push({ denominationKg: plate.denominationKg, count: n });
      remaining -= n * denomG;
    }
  }

  if (remaining > 0.5) return null;
  return result;
}

function sideLoadKg(stack: PlateOnSide[]): number {
  return stack.reduce((sum, p) => sum + p.denominationKg * p.count, 0);
}

export function solveLoad(targetKg: number, profile: LoadProfile): LoadSolution {
  const barG = toG(profile.barWeightKg);
  const collarG = toG(profile.collarWeightKg);
  const baseG = barG + collarG;
  const baseKg = toKg(baseG);
  const targetG = toG(targetKg);

  const empty = (actualG: number, exact: boolean, perSide: PlateOnSide[]): LoadSolution => ({
    targetKg,
    actualKg: toKg(actualG),
    exact,
    deltaKg: toKg(actualG - targetG),
    barWeightKg: profile.barWeightKg,
    collarWeightKg: profile.collarWeightKg,
    perSide,
    totalPlates: perSide.reduce((s, p) => s + p.count * 2, 0),
    baseKg,
  });

  if (targetG <= baseG) {
    return empty(baseG, targetG === baseG || targetG <= barG, []);
  }

  const sleeveTargetG = Math.round((targetG - baseG) / 2);
  const exact = greedyPerSideGrams(sleeveTargetG, profile.plates);
  if (exact) {
    const actualG = baseG + toG(sideLoadKg(exact)) * 2;
    return empty(actualG, actualG === targetG, exact);
  }

  const stepG = toG(smallestPlateKg(profile.plates));
  let t = Math.floor(sleeveTargetG / stepG) * stepG;
  while (t >= 0) {
    const sol = greedyPerSideGrams(t, profile.plates);
    if (sol) {
      const actualG = baseG + toG(sideLoadKg(sol)) * 2;
      return empty(actualG, false, sol);
    }
    t -= stepG;
  }

  return empty(baseG, false, []);
}

export function formatStack(perSide: PlateOnSide[]): string {
  if (!perSide.length) return "bar";
  return perSide.map((p) => `${p.count}×${p.denominationKg}`).join(" + ");
}
