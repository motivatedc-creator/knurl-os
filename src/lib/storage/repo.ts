import { estimate1RMFromSets } from "@/lib/domain/one-rm";
import { classifySet, parseStrongCsv, rowFingerprint, type CsvParseResult } from "@/lib/domain/csv";
import { defaultPrefs } from "@/lib/domain/equipment";
import type { RecordSet } from "@/lib/domain/records";
import {
  VAULT_SCHEMA_VERSION,
  vaultDumpSchema,
  type BodyMeasurement,
  type EquipmentProfile,
  type Exercise,
  type MeasurementMetric,
  type Prefs,
  type Template,
  type TemplateExercise,
  type VaultDump,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
} from "@/lib/domain/schema";
import { lbToKg } from "@/lib/domain/units";
import { newId, nowIso } from "@/lib/utils";
import { getDb, type KnurlDB } from "./db";

export type HydratedWorkoutExercise = WorkoutExercise & {
  sets: WorkoutSet[];
  previous?: { weightKg: number | null; reps: number | null; rpe: number | null }[];
};

export type HydratedWorkout = Workout & {
  exercises: HydratedWorkoutExercise[];
};

export type HydratedTemplate = Template & { exercises: TemplateExercise[] };

export interface StrengthRepository {
  listExercises(): Promise<Exercise[]>;
  upsertExercise(exercise: Exercise): Promise<void>;
  listTemplates(): Promise<HydratedTemplate[]>;
  getTemplate(id: string): Promise<HydratedTemplate | undefined>;
  saveTemplate(template: Template, exercises: TemplateExercise[]): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  getActiveWorkout(): Promise<HydratedWorkout | null>;
  getWorkout(id: string): Promise<HydratedWorkout | null>;
  listWorkouts(): Promise<Workout[]>;
  saveWorkout(workout: Workout, exercises: WorkoutExercise[], sets: WorkoutSet[]): Promise<void>;
  patchWorkout(workout: Workout): Promise<void>;
  upsertWorkoutExercise(row: WorkoutExercise): Promise<void>;
  upsertSet(set: WorkoutSet): Promise<void>;
  replaceExerciseSets(exerciseId: string, sets: WorkoutSet[]): Promise<void>;
  deleteWorkout(id: string): Promise<void>;
  listMeasurements(metric?: MeasurementMetric): Promise<BodyMeasurement[]>;
  addMeasurement(row: BodyMeasurement): Promise<void>;
  deleteMeasurement(id: string): Promise<void>;
  getEquipment(): Promise<EquipmentProfile>;
  saveEquipment(profile: EquipmentProfile): Promise<void>;
  getPrefs(): Promise<Prefs>;
  savePrefs(prefs: Prefs): Promise<void>;
  exportVault(): Promise<VaultDump>;
  restoreVault(dump: VaultDump, mode?: "replace" | "merge"): Promise<void>;
}

function db(): KnurlDB {
  return getDb();
}

async function hydrateWorkout(workout: Workout): Promise<HydratedWorkout> {
  const exercises = await db()
    .workoutExercises.where("workoutId")
    .equals(workout.id)
    .sortBy("order");
  const allSets = await db()
    .workoutSets.where("workoutExerciseId")
    .anyOf(exercises.map((e) => e.id))
    .toArray();
  const byEx = new Map<string, WorkoutSet[]>();
  for (const set of allSets) {
    const list = byEx.get(set.workoutExerciseId) ?? [];
    list.push(set);
    byEx.set(set.workoutExerciseId, list);
  }

  const previousByExercise = await previousSetsFor(
    exercises.map((e) => e.exerciseId),
    workout.id,
  );

  return {
    ...workout,
    exercises: exercises.map((ex) => ({
      ...ex,
      sets: (byEx.get(ex.id) ?? []).sort((a, b) => a.setIndex - b.setIndex),
      previous: previousByExercise.get(ex.exerciseId),
    })),
  };
}

async function previousSetsFor(
  exerciseIds: string[],
  currentWorkoutId: string,
): Promise<Map<string, { weightKg: number | null; reps: number | null; rpe: number | null }[]>> {
  const map = new Map<string, { weightKg: number | null; reps: number | null; rpe: number | null }[]>();
  const completed = await db()
    .workouts.where("status")
    .equals("completed")
    .reverse()
    .sortBy("completedAt");

  for (const exerciseId of exerciseIds) {
    for (const workout of completed) {
      if (workout.id === currentWorkoutId) continue;
      const rows = await db()
        .workoutExercises.where("workoutId")
        .equals(workout.id)
        .and((e) => e.exerciseId === exerciseId)
        .toArray();
      if (!rows.length) continue;
      const sets = (
        await db().workoutSets.where("workoutExerciseId").equals(rows[0]!.id).sortBy("setIndex")
      )
        .filter((s) => s.isCompleted && s.classification !== "warmup")
        .map((s) => ({ weightKg: s.weightKg, reps: s.reps, rpe: s.rpe }));
      if (sets.length) {
        map.set(exerciseId, sets);
        break;
      }
    }
  }
  return map;
}

export const vault: StrengthRepository = {
  async listExercises() {
    return db().exercises.orderBy("name").toArray();
  },
  async upsertExercise(exercise) {
    await db().exercises.put(exercise);
  },
  async listTemplates() {
    const templates = await db().templates.orderBy("updatedAt").reverse().toArray();
    const all = await db().templateExercises.toArray();
    return templates
      .filter((t) => !t.isArchived)
      .map((t) => ({
        ...t,
        exercises: all.filter((e) => e.templateId === t.id).sort((a, b) => a.order - b.order),
      }));
  },
  async getTemplate(id) {
    const template = await db().templates.get(id);
    if (!template) return undefined;
    const exercises = await db()
      .templateExercises.where("templateId")
      .equals(id)
      .sortBy("order");
    return { ...template, exercises };
  },
  async saveTemplate(template, exercises) {
    await db().transaction("rw", db().templates, db().templateExercises, async () => {
      await db().templates.put(template);
      await db().templateExercises.where("templateId").equals(template.id).delete();
      if (exercises.length) await db().templateExercises.bulkAdd(exercises);
    });
  },
  async deleteTemplate(id) {
    await db().transaction("rw", db().templates, db().templateExercises, async () => {
      await db().templates.delete(id);
      await db().templateExercises.where("templateId").equals(id).delete();
    });
  },
  async getActiveWorkout() {
    const row = await db().workouts.where("status").equals("active").first();
    if (!row) return null;
    return hydrateWorkout(row);
  },
  async getWorkout(id) {
    const row = await db().workouts.get(id);
    if (!row) return null;
    return hydrateWorkout(row);
  },
  async listWorkouts() {
    return db().workouts.orderBy("startedAt").reverse().toArray();
  },
  async saveWorkout(workout, exercises, sets) {
    await db().transaction(
      "rw",
      db().workouts,
      db().workoutExercises,
      db().workoutSets,
      async () => {
        const previous = await db().workoutExercises.where("workoutId").equals(workout.id).toArray();
        const previousIds = previous.map((e) => e.id);
        await db().workouts.put(workout);
        if (previousIds.length) {
          await db().workoutSets.where("workoutExerciseId").anyOf(previousIds).delete();
        }
        await db().workoutExercises.where("workoutId").equals(workout.id).delete();
        if (exercises.length) await db().workoutExercises.bulkPut(exercises);
        if (sets.length) await db().workoutSets.bulkPut(sets);
      },
    );
  },
  async patchWorkout(workout) {
    await db().workouts.put(workout);
  },
  async upsertWorkoutExercise(row) {
    await db().workoutExercises.put(row);
  },
  async upsertSet(set) {
    await db().workoutSets.put(set);
  },
  async replaceExerciseSets(exerciseId, sets) {
    await db().transaction("rw", db().workoutSets, async () => {
      await db().workoutSets.where("workoutExerciseId").equals(exerciseId).delete();
      if (sets.length) await db().workoutSets.bulkAdd(sets);
    });
  },
  async deleteWorkout(id) {
    await db().transaction("rw", db().workouts, db().workoutExercises, db().workoutSets, async () => {
      const exercises = await db().workoutExercises.where("workoutId").equals(id).toArray();
      await db().workoutSets.where("workoutExerciseId").anyOf(exercises.map((e) => e.id)).delete();
      await db().workoutExercises.where("workoutId").equals(id).delete();
      await db().workouts.delete(id);
    });
  },
  async listMeasurements(metric) {
    if (metric) {
      return db().bodyMeasurements.where("metric").equals(metric).reverse().sortBy("measuredAt");
    }
    return db().bodyMeasurements.orderBy("measuredAt").reverse().toArray();
  },
  async addMeasurement(row) {
    await db().bodyMeasurements.put(row);
  },
  async deleteMeasurement(id) {
    await db().bodyMeasurements.delete(id);
  },
  async getEquipment() {
    const row = await db().equipment.get("default");
    if (!row) throw new Error("Equipment profile missing");
    return row;
  },
  async saveEquipment(profile) {
    await db().equipment.put(profile);
  },
  async getPrefs() {
    const row = await db().prefs.get("singleton");
    if (!row) throw new Error("Prefs missing");
    return { ...defaultPrefs(), ...row };
  },
  async savePrefs(prefs) {
    await db().prefs.put(prefs);
  },
  async exportVault() {
    const [
      exercises,
      templates,
      templateExercises,
      workouts,
      workoutExercises,
      workoutSets,
      bodyMeasurements,
      equipmentProfile,
      prefs,
    ] = await Promise.all([
      db().exercises.toArray(),
      db().templates.toArray(),
      db().templateExercises.toArray(),
      db().workouts.toArray(),
      db().workoutExercises.toArray(),
      db().workoutSets.toArray(),
      db().bodyMeasurements.toArray(),
      vault.getEquipment(),
      vault.getPrefs(),
    ]);
    return {
      schemaVersion: VAULT_SCHEMA_VERSION,
      exportedAt: nowIso(),
      brand: "knurl-os" as const,
      exercises,
      templates,
      templateExercises,
      workouts,
      workoutExercises,
      workoutSets,
      bodyMeasurements,
      equipmentProfile,
      prefs,
    };
  },
  async restoreVault(dump, mode = "replace") {
    const parsed = vaultDumpSchema.parse(dump);
    if (parsed.schemaVersion > VAULT_SCHEMA_VERSION) {
      throw new Error(`Vault schema ${parsed.schemaVersion} is newer than this build.`);
    }
    if (mode === "merge") {
      await mergeVault(parsed);
      return;
    }
    await db().transaction("rw", db().tables, async () => {
        await Promise.all([
          db().exercises.clear(),
          db().templates.clear(),
          db().templateExercises.clear(),
          db().workouts.clear(),
          db().workoutExercises.clear(),
          db().workoutSets.clear(),
          db().bodyMeasurements.clear(),
        ]);
        await db().exercises.bulkAdd(parsed.exercises);
        await db().templates.bulkAdd(parsed.templates);
        await db().templateExercises.bulkAdd(parsed.templateExercises);
        await db().workouts.bulkAdd(parsed.workouts);
        await db().workoutExercises.bulkAdd(parsed.workoutExercises);
        await db().workoutSets.bulkAdd(parsed.workoutSets);
        await db().bodyMeasurements.bulkAdd(parsed.bodyMeasurements);
        await db().equipment.put(parsed.equipmentProfile);
        await db().prefs.put({ ...defaultPrefs(), ...parsed.prefs });
    });
  },
};

async function mergeVault(parsed: VaultDump): Promise<void> {
  await db().transaction("rw", db().tables, async () => {
    const addMissing = async <T extends { id: string }>(
      get: (id: string) => Promise<T | undefined>,
      add: (row: T) => Promise<unknown>,
      rows: T[],
    ) => {
      for (const row of rows) {
        if (!(await get(row.id))) await add(row);
      }
    };
    await addMissing((id) => db().exercises.get(id), (row) => db().exercises.add(row), parsed.exercises);
    await addMissing((id) => db().templates.get(id), (row) => db().templates.add(row), parsed.templates);
    await addMissing(
      (id) => db().templateExercises.get(id),
      (row) => db().templateExercises.add(row),
      parsed.templateExercises,
    );
    await addMissing((id) => db().workouts.get(id), (row) => db().workouts.add(row), parsed.workouts);
    await addMissing(
      (id) => db().workoutExercises.get(id),
      (row) => db().workoutExercises.add(row),
      parsed.workoutExercises,
    );
    await addMissing((id) => db().workoutSets.get(id), (row) => db().workoutSets.add(row), parsed.workoutSets);
    await addMissing(
      (id) => db().bodyMeasurements.get(id),
      (row) => db().bodyMeasurements.add(row),
      parsed.bodyMeasurements,
    );
  });
}

export async function duplicateTemplate(id: string): Promise<string> {
  const source = await vault.getTemplate(id);
  if (!source) throw new Error("Routine not found");
  const nextId = newId();
  const stamp = nowIso();
  await vault.saveTemplate(
    {
      id: nextId,
      name: `${source.name} copy`,
      notes: source.notes,
      isArchived: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    source.exercises.map((line) => ({
      ...line,
      id: newId(),
      templateId: nextId,
    })),
  );
  return nextId;
}

export async function recentExerciseIds(limit = 24): Promise<string[]> {
  const workouts = await db()
    .workouts.where("status")
    .equals("completed")
    .reverse()
    .sortBy("completedAt");
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const w of workouts) {
    const rows = await db().workoutExercises.where("workoutId").equals(w.id).sortBy("order");
    for (const row of rows) {
      if (seen.has(row.exerciseId)) continue;
      seen.add(row.exerciseId);
      ids.push(row.exerciseId);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

export async function listHistoryForExercise(exerciseId: string) {
  const rows = await db().workoutExercises.where("exerciseId").equals(exerciseId).toArray();
  const out: { workout: Workout; exercise: WorkoutExercise; sets: WorkoutSet[] }[] = [];
  for (const row of rows) {
    const workout = await db().workouts.get(row.workoutId);
    if (!workout || workout.status !== "completed") continue;
    const sets = await db().workoutSets.where("workoutExerciseId").equals(row.id).sortBy("setIndex");
    out.push({ workout, exercise: row, sets });
  }
  return out.sort((a, b) => (b.workout.completedAt ?? "").localeCompare(a.workout.completedAt ?? ""));
}

export async function collectRecordSets(excludeWorkoutId?: string): Promise<RecordSet[]> {
  const exercises = await db().workoutExercises.toArray();
  const workouts = await db().workouts.toArray();
  const byWorkout = new Map(workouts.map((w) => [w.id, w]));
  const out: RecordSet[] = [];
  for (const ex of exercises) {
    const workout = byWorkout.get(ex.workoutId);
    if (!workout || workout.status !== "completed") continue;
    if (excludeWorkoutId && workout.id === excludeWorkoutId) continue;
    const sets = await db().workoutSets.where("workoutExerciseId").equals(ex.id).toArray();
    for (const set of sets) {
      out.push({
        id: set.id,
        exerciseId: ex.exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        classification: set.classification,
        isCompleted: set.isCompleted,
        performedAt: set.completedAt ?? workout.completedAt ?? workout.startedAt,
      });
    }
  }
  return out;
}

export async function exerciseHasHistory(exerciseId: string): Promise<boolean> {
  const hit = await db().workoutExercises.where("exerciseId").equals(exerciseId).first();
  return Boolean(hit);
}

export async function getRestTimer() {
  return db().restTimers.get("rest-timer");
}

export async function setRestTimer(
  row: { startedAt: string; endsAt: string; durationSec: number; label: string } | null,
): Promise<void> {
  if (!row) {
    await db().restTimers.delete("rest-timer");
    return;
  }
  await db().restTimers.put({ id: "rest-timer", ...row });
}

export async function startBlankWorkout(name = "Open session"): Promise<HydratedWorkout> {
  const existing = await vault.getActiveWorkout();
  if (existing) return existing;
  const stamp = nowIso();
  const workout: Workout = {
    id: newId(),
    templateId: null,
    name,
    status: "active",
    startedAt: stamp,
    completedAt: null,
    durationSeconds: null,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    notes: "",
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db().workouts.add(workout);
  return { ...workout, exercises: [] };
}

export async function startFromTemplate(templateId: string): Promise<HydratedWorkout> {
  const existing = await vault.getActiveWorkout();
  if (existing) return existing;
  const template = await vault.getTemplate(templateId);
  if (!template) throw new Error("Routine not found");
  const catalog = await vault.listExercises();
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const stamp = nowIso();
  const workout: Workout = {
    id: newId(),
    templateId,
    name: template.name,
    status: "active",
    startedAt: stamp,
    completedAt: null,
    durationSeconds: null,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    notes: "",
    createdAt: stamp,
    updatedAt: stamp,
  };
  const exercises: WorkoutExercise[] = [];
  const sets: WorkoutSet[] = [];
  for (const line of template.exercises) {
    const ex = byId.get(line.exerciseId);
    if (!ex) continue;
    const we: WorkoutExercise = {
      id: newId(),
      workoutId: workout.id,
      exerciseId: ex.id,
      order: line.order,
      supersetId: line.supersetId,
      snapshotName: ex.name,
      snapshotPrimary: ex.primaryMuscleGroup,
      snapshotSecondary: ex.secondaryMuscleGroups,
      snapshotEquipment: ex.equipmentType,
      snapshotPattern: ex.movementPattern,
      snapshotTracking: ex.trackingType,
      restSeconds: line.restSeconds,
      includeWarmup: line.includeWarmup,
      notes: line.notes,
    };
    exercises.push(we);
    for (let i = 0; i < line.targetSets; i++) {
      sets.push({
        id: newId(),
        workoutExerciseId: we.id,
        setIndex: i,
        classification: "working",
        weightKg: null,
        reps: null,
        durationSeconds: null,
        distanceMeters: null,
        rpe: line.targetRpe,
        rir: line.targetRir,
        completedAt: null,
        isCompleted: false,
      });
    }
  }
  await vault.saveWorkout(workout, exercises, sets);
  return hydrateWorkout(workout);
}

export async function addExerciseToWorkout(
  workoutId: string,
  exercise: Exercise,
  restSeconds = 120,
): Promise<void> {
  const current = await db().workoutExercises.where("workoutId").equals(workoutId).toArray();
  const we: WorkoutExercise = {
    id: newId(),
    workoutId,
    exerciseId: exercise.id,
    order: current.length,
    supersetId: null,
    snapshotName: exercise.name,
    snapshotPrimary: exercise.primaryMuscleGroup,
    snapshotSecondary: exercise.secondaryMuscleGroups,
    snapshotEquipment: exercise.equipmentType,
    snapshotPattern: exercise.movementPattern,
    snapshotTracking: exercise.trackingType,
    restSeconds,
    includeWarmup: current.length === 0,
    notes: "",
  };
  const sets: WorkoutSet[] = [0, 1, 2].map((i) => ({
    id: newId(),
    workoutExerciseId: we.id,
    setIndex: i,
    classification: "working" as const,
    weightKg: null,
    reps: null,
    durationSeconds: null,
    distanceMeters: null,
    rpe: null,
    rir: null,
    completedAt: null,
    isCompleted: false,
  }));
  await db().transaction("rw", db().workoutExercises, db().workoutSets, async () => {
    await db().workoutExercises.add(we);
    await db().workoutSets.bulkAdd(sets);
  });
}

export async function finishWorkout(id: string): Promise<void> {
  const workout = await db().workouts.get(id);
  if (!workout) return;
  const stamp = nowIso();
  const durationSeconds = Math.max(
    0,
    Math.round((Date.parse(stamp) - Date.parse(workout.startedAt)) / 1000),
  );
  await db().workouts.put({
    ...workout,
    status: "completed",
    completedAt: stamp,
    durationSeconds,
    updatedAt: stamp,
  });
}

export type ImportPreview = CsvParseResult & {
  workoutCount: number;
  newExerciseNames: string[];
  duplicateRows: number;
};

export async function previewCsvImport(text: string): Promise<ImportPreview> {
  const parsed = parseStrongCsv(text);
  const existing = new Set((await db().importReceipts.toArray()).map((r) => r.fingerprint));
  let duplicateRows = 0;
  const names = new Set<string>();
  const workouts = new Set<string>();
  const catalog = await db().exercises.toArray();
  const catalogNames = new Set(catalog.map((e) => e.name.toLowerCase()));
  const newExerciseNames: string[] = [];
  for (const row of parsed.rows) {
    const fp = rowFingerprint(row);
    if (existing.has(fp)) {
      duplicateRows += 1;
      continue;
    }
    workouts.add(`${row.date}|${row.workoutName}`);
    const key = (row.exerciseName ?? "").toLowerCase();
    if (key && !catalogNames.has(key) && !names.has(key)) {
      names.add(key);
      newExerciseNames.push(row.exerciseName!);
    }
  }
  return {
    ...parsed,
    workoutCount: workouts.size,
    newExerciseNames,
    duplicateRows,
  };
}

export async function commitCsvImport(text: string): Promise<{ imported: number; skipped: number }> {
  const parsed = parseStrongCsv(text);
  const existingFp = new Set((await db().importReceipts.toArray()).map((r) => r.fingerprint));
  const catalog = await db().exercises.toArray();
  const byName = new Map(catalog.map((e) => [e.name.toLowerCase(), e]));
  let imported = 0;
  let skipped = 0;

  type Bucket = { rows: typeof parsed.rows };
  const groups = new Map<string, Bucket>();
  for (const row of parsed.rows) {
    const fp = rowFingerprint(row);
    if (existingFp.has(fp)) {
      skipped += 1;
      continue;
    }
    const key = `${row.date}|${row.workoutName}`;
    const g = groups.get(key) ?? { rows: [] };
    g.rows.push(row);
    groups.set(key, g);
  }

  await db().transaction(
    "rw",
    db().exercises,
    db().workouts,
    db().workoutExercises,
    db().workoutSets,
    db().importReceipts,
    async () => {
      for (const [key, group] of groups) {
        const [date, name] = key.split("|");
        const startedAt = date ? new Date(date).toISOString() : nowIso();
        const workoutId = newId();
        const workout: Workout = {
          id: workoutId,
          templateId: null,
          name: name || "Imported",
          status: "completed",
          startedAt,
          completedAt: startedAt,
          durationSeconds: null,
          timezoneOffsetMinutes: 0,
          notes: group.rows.find((r) => r.workoutNotes)?.workoutNotes ?? "",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        await db().workouts.add(workout);

        const byExercise = new Map<string, typeof group.rows>();
        for (const row of group.rows) {
          const n = row.exerciseName ?? "Unknown";
          const list = byExercise.get(n) ?? [];
          list.push(row);
          byExercise.set(n, list);
        }
        let order = 0;
        for (const [exName, rows] of byExercise) {
          let exercise = byName.get(exName.toLowerCase());
          if (!exercise) {
            exercise = {
              id: newId(),
              name: exName,
              primaryMuscleGroup: "chest",
              secondaryMuscleGroups: [],
              equipmentType: "barbell",
              movementPattern: "push",
              trackingType: "weight_reps",
              isCustom: true,
              isArchived: false,
              notes: "Created from CSV import",
              createdAt: nowIso(),
              updatedAt: nowIso(),
            };
            await db().exercises.add(exercise);
            byName.set(exName.toLowerCase(), exercise);
          }
          const we: WorkoutExercise = {
            id: newId(),
            workoutId,
            exerciseId: exercise.id,
            order: order++,
            supersetId: null,
            snapshotName: exercise.name,
            snapshotPrimary: exercise.primaryMuscleGroup,
            snapshotSecondary: exercise.secondaryMuscleGroups,
            snapshotEquipment: exercise.equipmentType,
            snapshotPattern: exercise.movementPattern,
            snapshotTracking: exercise.trackingType,
            restSeconds: 120,
            includeWarmup: false,
            notes: "",
          };
          await db().workoutExercises.add(we);
          const sets: WorkoutSet[] = rows.map((row, i) => {
            let weightKg = row.weight;
            if (weightKg != null && row.weightUnit === "lb") weightKg = lbToKg(weightKg);
            return {
              id: newId(),
              workoutExerciseId: we.id,
              setIndex: row.setOrder ?? i,
              classification: classifySet(row.setType) ?? (row.notes.toLowerCase().includes("warm") ? "warmup" : "working"),
              weightKg,
              reps: row.reps,
              durationSeconds: row.seconds,
              distanceMeters: row.distance,
              rpe: row.rpe,
              rir: null,
              completedAt: startedAt,
              isCompleted: true,
            };
          });
          await db().workoutSets.bulkAdd(sets);
          imported += sets.length;
          await db().importReceipts.bulkPut(
            rows.map((row) => ({ fingerprint: rowFingerprint(row), importedAt: nowIso() })),
          );
        }
      }
    },
  );

  return { imported, skipped };
}

export { estimate1RMFromSets };
