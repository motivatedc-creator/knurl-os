import { estimate1RMFromSets } from "@/lib/domain/one-rm";
import { computeStreak } from "@/lib/domain/streak";
import {
  attributeVolume,
  bucketVolume,
  setVolumeKg,
} from "@/lib/domain/volume";
import type { OneRmFormula, Workout } from "@/lib/domain/schema";
import { localDateKey } from "@/lib/utils";
import { getDb } from "./db";

export type DayVolume = { day: string; kg: number };

export type DashboardStats = {
  streak: number;
  sessionsThisWeek: number;
  weekVolumeKg: number;
  prevWeekVolumeKg: number;
  series: DayVolume[];
  lastCompleted: Workout | undefined;
};

function weekStart(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function loadDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const workouts = await db.workouts.toArray();
  const completed = workouts.filter((w) => w.status === "completed" && w.completedAt);
  const days = completed.map((w) => localDateKey(new Date(w.completedAt ?? w.startedAt)));
  const streak = computeStreak(days, localDateKey());

  const start = weekStart();
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  const startIso = start.toISOString();
  const prevIso = prevStart.toISOString();

  const thisWeek = completed.filter((w) => (w.completedAt ?? "") >= startIso);
  const prevWeek = completed.filter(
    (w) => (w.completedAt ?? "") >= prevIso && (w.completedAt ?? "") < startIso,
  );

  const volumeFor = async (list: Workout[]) => {
    let total = 0;
    for (const w of list) {
      total += await workoutTonnage(w.id);
    }
    return total;
  };

  const seriesDays: DayVolume[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    const daysWorkouts = completed.filter(
      (w) => localDateKey(new Date(w.completedAt ?? w.startedAt)) === key,
    );
    seriesDays.push({ day: key.slice(5), kg: await volumeFor(daysWorkouts) });
  }

  return {
    streak,
    sessionsThisWeek: thisWeek.length,
    weekVolumeKg: await volumeFor(thisWeek),
    prevWeekVolumeKg: await volumeFor(prevWeek),
    series: seriesDays,
    lastCompleted: completed.sort((a, b) =>
      (b.completedAt ?? "").localeCompare(a.completedAt ?? ""),
    )[0],
  };
}

export async function workoutTonnage(workoutId: string): Promise<number> {
  const db = getDb();
  const exercises = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
  const sets = await db.workoutSets.where("workoutExerciseId").anyOf(exercises.map((e) => e.id)).toArray();
  let total = 0;
  for (const set of sets) {
    if (!set.isCompleted || set.classification === "warmup") continue;
    if (set.weightKg == null || set.reps == null) continue;
    total += setVolumeKg(set.weightKg, set.reps);
  }
  return total;
}

export type AnalyticsRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export function rangeStart(range: AnalyticsRange): Date | null {
  if (range === "ALL") return null;
  const d = new Date();
  const months = range === "1M" ? 1 : range === "3M" ? 3 : range === "6M" ? 6 : 12;
  d.setMonth(d.getMonth() - months);
  return d;
}

export type AnalyticsPayload = {
  e1rm: { name: string; points: { date: string; value: number }[] }[];
  buckets: { muscle: string; kg: number }[];
  repMax: { name: string; r1: number | null; r3: number | null; r5: number | null; r8: number | null; r10: number | null }[];
};

const TRACKED = ["Back Squat", "Conventional Deadlift", "Barbell Bench Press", "Overhead Press"];

export async function loadAnalytics(
  range: AnalyticsRange,
  formula: OneRmFormula,
  secondaryFactor: number,
): Promise<AnalyticsPayload> {
  const db = getDb();
  const start = rangeStart(range);
  const workouts = (await db.workouts.toArray()).filter((w) => {
    if (w.status !== "completed") return false;
    if (!start) return true;
    return (w.completedAt ?? w.startedAt) >= start.toISOString();
  });

  const e1rmMap = new Map<string, { date: string; value: number }[]>();
  const muscleTotals: Record<string, number> = {};
  const bestByRep = new Map<string, Record<number, number>>();

  for (const workout of workouts) {
    const exercises = await db.workoutExercises.where("workoutId").equals(workout.id).sortBy("order");
    for (const ex of exercises) {
      const sets = await db.workoutSets.where("workoutExerciseId").equals(ex.id).sortBy("setIndex");
      const e1 = estimate1RMFromSets(sets, formula);
      if (e1 != null && TRACKED.includes(ex.snapshotName)) {
        const list = e1rmMap.get(ex.snapshotName) ?? [];
        list.push({ date: (workout.completedAt ?? workout.startedAt).slice(0, 10), value: Math.round(e1 * 10) / 10 });
        e1rmMap.set(ex.snapshotName, list);
      }
      for (const set of sets) {
        if (!set.isCompleted || set.classification === "warmup") continue;
        if (set.weightKg == null || set.reps == null) continue;
        const vol = setVolumeKg(set.weightKg, set.reps);
        const attr = attributeVolume(vol, ex.snapshotPrimary, ex.snapshotSecondary, secondaryFactor);
        for (const [k, v] of Object.entries(attr)) {
          muscleTotals[k] = (muscleTotals[k] ?? 0) + v;
        }
        const brackets = [1, 3, 5, 8, 10];
        const hit = brackets.find((b) => set.reps === b) ?? (set.reps <= 10 ? set.reps : null);
        if (hit && TRACKED.includes(ex.snapshotName)) {
          const rec = bestByRep.get(ex.snapshotName) ?? {};
          rec[hit] = Math.max(rec[hit] ?? 0, set.weightKg);
          bestByRep.set(ex.snapshotName, rec);
        }
      }
    }
  }

  const buckets = Object.entries(bucketVolume(muscleTotals))
    .map(([muscle, kg]) => ({ muscle, kg: Math.round(kg) }))
    .sort((a, b) => b.kg - a.kg);

  const repMax = TRACKED.map((name) => {
    const rec = bestByRep.get(name) ?? {};
    return {
      name,
      r1: rec[1] ?? null,
      r3: rec[3] ?? null,
      r5: rec[5] ?? null,
      r8: rec[8] ?? null,
      r10: rec[10] ?? null,
    };
  });

  const e1rm = TRACKED.filter((n) => e1rmMap.has(n)).map((name) => ({
    name,
    points: (e1rmMap.get(name) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
  }));

  return { e1rm, buckets, repMax };
}
