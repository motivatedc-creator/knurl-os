import { catalogId, newId, nowIso, templateId } from "@/lib/utils";
import type { Template, TemplateExercise } from "./schema";

type Line = {
  exercise: number;
  sets: number;
  repMin: number;
  repMax: number;
  rest: number;
  rpe?: number;
  warmup?: boolean;
  superset?: string;
};

function pack(
  idNum: number,
  name: string,
  notes: string,
  lines: Line[],
): { template: Template; exercises: TemplateExercise[] } {
  const stamp = nowIso();
  const id = templateId(idNum);
  const template: Template = {
    id,
    name,
    notes,
    isArchived: false,
    createdAt: stamp,
    updatedAt: stamp,
  };
  const exercises: TemplateExercise[] = lines.map((line, order) => ({
    id: newId(),
    templateId: id,
    exerciseId: catalogId(line.exercise),
    order,
    supersetId: line.superset ?? null,
    targetSets: line.sets,
    repMin: line.repMin,
    repMax: line.repMax,
    targetRpe: line.rpe ?? 8,
    targetRir: null,
    restSeconds: line.rest,
    includeWarmup: line.warmup ?? order === 0,
    notes: "",
  }));
  return { template, exercises };
}

export function starterTemplates(): { templates: Template[]; exercises: TemplateExercise[] } {
  const a = pack(1, "Lower A", "Squat primary. Keep the last working set at the prescribed RPE.", [
    { exercise: 1, sets: 5, repMin: 5, repMax: 5, rest: 180, rpe: 8, warmup: true },
    { exercise: 7, sets: 3, repMin: 6, repMax: 8, rest: 150, rpe: 8 },
    { exercise: 53, sets: 3, repMin: 8, repMax: 10, rest: 120, rpe: 8 },
    { exercise: 56, sets: 3, repMin: 8, repMax: 12, rest: 90, rpe: 9 },
    { exercise: 62, sets: 3, repMin: 10, repMax: 12, rest: 75, rpe: 9 },
  ]);
  const b = pack(2, "Upper A", "Horizontal press primary. Row pairs as a superset on the last accessory.", [
    { exercise: 13, sets: 5, repMin: 5, repMax: 5, rest: 180, rpe: 8, warmup: true },
    { exercise: 20, sets: 5, repMin: 5, repMax: 5, rest: 150, rpe: 8 },
    { exercise: 18, sets: 3, repMin: 6, repMax: 8, rest: 150, rpe: 8 },
    { exercise: 65, sets: 3, repMin: 5, repMax: 8, rest: 150, rpe: 8 },
    { exercise: 48, sets: 3, repMin: 10, repMax: 12, rest: 75, rpe: 9, superset: "finisher" },
    { exercise: 37, sets: 3, repMin: 10, repMax: 12, rest: 75, rpe: 9, superset: "finisher" },
  ]);
  const c = pack(3, "Lower B", "Hinge primary. Split squat after the deadlift, not before.", [
    { exercise: 5, sets: 3, repMin: 3, repMax: 5, rest: 210, rpe: 8, warmup: true },
    { exercise: 3, sets: 3, repMin: 6, repMax: 8, rest: 150, rpe: 8 },
    { exercise: 36, sets: 3, repMin: 8, repMax: 10, rest: 120, rpe: 8 },
    { exercise: 12, sets: 3, repMin: 8, repMax: 10, rest: 120, rpe: 8 },
    { exercise: 57, sets: 3, repMin: 10, repMax: 12, rest: 75, rpe: 9 },
  ]);
  const d = pack(4, "Upper B", "Vertical press primary. Weighted chins if bodyweight sets exceed 8.", [
    { exercise: 18, sets: 5, repMin: 5, repMax: 5, rest: 180, rpe: 8, warmup: true },
    { exercise: 66, sets: 5, repMin: 5, repMax: 8, rest: 150, rpe: 8 },
    { exercise: 30, sets: 3, repMin: 8, repMax: 10, rest: 120, rpe: 8 },
    { exercise: 46, sets: 3, repMin: 12, repMax: 15, rest: 75, rpe: 8 },
    { exercise: 38, sets: 3, repMin: 8, repMax: 12, rest: 75, rpe: 9 },
  ]);
  return {
    templates: [a, b, c, d].map((x) => x.template),
    exercises: [a, b, c, d].flatMap((x) => x.exercises),
  };
}
