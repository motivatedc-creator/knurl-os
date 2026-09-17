import { VOLUME_BUCKET, type MuscleGroup, type SetClassification } from "./schema";

export type VolumeSet = {
  weightKg: number | null;
  reps: number | null;
  classification: SetClassification;
  isCompleted: boolean;
};

export function setVolumeKg(weightKg: number, reps: number): number {
  if (!(weightKg > 0) || !(reps > 0)) return 0;
  return weightKg * reps;
}

export function attributeVolume(
  volume: number,
  primary: MuscleGroup,
  secondary: MuscleGroup[],
  secondaryFactor = 0.5,
): Record<MuscleGroup, number> {
  const out = {} as Record<MuscleGroup, number>;
  out[primary] = (out[primary] ?? 0) + volume * 1;
  for (const muscle of secondary) {
    out[muscle] = (out[muscle] ?? 0) + volume * secondaryFactor;
  }
  return out;
}

export function bucketVolume(byMuscle: Record<string, number>): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (const [muscle, value] of Object.entries(byMuscle)) {
    const bucket = VOLUME_BUCKET[muscle as MuscleGroup] ?? muscle;
    buckets[bucket] = (buckets[bucket] ?? 0) + value;
  }
  return buckets;
}

export function workoutVolumeFromSets(sets: VolumeSet[]): number {
  let total = 0;
  for (const set of sets) {
    if (!set.isCompleted) continue;
    if (set.classification === "warmup") continue;
    if (set.weightKg == null || set.reps == null) continue;
    total += setVolumeKg(set.weightKg, set.reps);
  }
  return total;
}
