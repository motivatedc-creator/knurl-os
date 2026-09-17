import Dexie, { type EntityTable } from "dexie";
import type {
  BodyMeasurement,
  EquipmentProfile,
  Exercise,
  Prefs,
  Template,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/lib/domain/schema";

export type ImportReceipt = {
  fingerprint: string;
  importedAt: string;
};

export type RestTimerRow = {
  id: "rest-timer";
  startedAt: string;
  endsAt: string;
  durationSec: number;
  label: string;
};

export class KnurlDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  templates!: EntityTable<Template, "id">;
  templateExercises!: EntityTable<TemplateExercise, "id">;
  workouts!: EntityTable<Workout, "id">;
  workoutExercises!: EntityTable<WorkoutExercise, "id">;
  workoutSets!: EntityTable<WorkoutSet, "id">;
  bodyMeasurements!: EntityTable<BodyMeasurement, "id">;
  equipment!: EntityTable<EquipmentProfile, "id">;
  prefs!: EntityTable<Prefs, "id">;
  importReceipts!: EntityTable<ImportReceipt, "fingerprint">;
  restTimers!: EntityTable<RestTimerRow, "id">;

  constructor() {
    super("knurl-os");
    this.version(1).stores({
      exercises: "id, name, primaryMuscleGroup, isArchived, isCustom",
      templates: "id, name, isArchived, updatedAt",
      templateExercises: "id, templateId, exerciseId, order",
      workouts: "id, status, startedAt, completedAt, templateId, name",
      workoutExercises: "id, workoutId, exerciseId, order",
      workoutSets: "id, workoutExerciseId, setIndex, isCompleted",
      bodyMeasurements: "id, metric, measuredAt",
      equipment: "id",
      prefs: "id",
      importReceipts: "fingerprint, importedAt",
    });
    this.version(2).stores({
      restTimers: "id",
    });
  }
}

let instance: KnurlDB | null = null;

export function isVaultAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getDb(): KnurlDB {
  if (!isVaultAvailable()) {
    throw new Error("IndexedDB is not available in this environment.");
  }
  if (!instance) instance = new KnurlDB();
  return instance;
}

export async function resetDbForTests(): Promise<void> {
  if (instance) {
    instance.close();
    instance = null;
  }
  if (typeof indexedDB !== "undefined") {
    await Dexie.delete("knurl-os");
  }
}
