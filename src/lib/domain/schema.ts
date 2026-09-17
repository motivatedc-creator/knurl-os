import { z } from "zod";

export const muscleGroups = [
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "adductors",
  "chest",
  "lats",
  "upper_back",
  "traps",
  "spinal_erectors",
  "front_delts",
  "side_delts",
  "rear_delts",
  "biceps",
  "triceps",
  "forearms",
  "abdominals",
  "obliques",
  "neck",
] as const;
export type MuscleGroup = (typeof muscleGroups)[number];

export const equipmentTypes = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "specialty_bar",
] as const;
export type EquipmentType = (typeof equipmentTypes)[number];

export const movementPatterns = [
  "squat",
  "hinge",
  "push",
  "pull",
  "carry",
  "isolation",
] as const;
export type MovementPattern = (typeof movementPatterns)[number];

export const trackingTypes = [
  "weight_reps",
  "reps_only",
  "duration",
  "distance_time",
] as const;
export type TrackingType = (typeof trackingTypes)[number];

export const setClassifications = ["warmup", "working", "drop", "failure"] as const;
export type SetClassification = (typeof setClassifications)[number];

export const workoutStatuses = ["active", "completed", "discarded"] as const;
export type WorkoutStatus = (typeof workoutStatuses)[number];

export const measurementMetrics = [
  "bodyweight",
  "arms",
  "chest",
  "waist",
  "hips",
  "thighs",
  "calves",
  "shoulders",
  "neck",
] as const;
export type MeasurementMetric = (typeof measurementMetrics)[number];

export const unitSystems = ["kg", "lb"] as const;
export type UnitSystem = (typeof unitSystems)[number];

export const themes = ["mill", "chalk"] as const;
export type ThemeName = (typeof themes)[number];

export const oneRmFormulas = ["epley", "brzycki"] as const;
export type OneRmFormula = (typeof oneRmFormulas)[number];

export const appIcons = ["mark", "solid", "oxide"] as const;
export type AppIcon = (typeof appIcons)[number];

export const barKinds = [
  "olympic_20",
  "olympic_15",
  "hex",
  "ssb",
  "custom",
] as const;
export type BarKind = (typeof barKinds)[number];

const id = z.string().min(8);
const iso = z.string().min(10);

export const muscleGroupSchema = z.enum(muscleGroups);
export const equipmentTypeSchema = z.enum(equipmentTypes);
export const movementPatternSchema = z.enum(movementPatterns);
export const trackingTypeSchema = z.enum(trackingTypes);

export const exerciseSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  primaryMuscleGroup: muscleGroupSchema,
  secondaryMuscleGroups: z.array(muscleGroupSchema),
  equipmentType: equipmentTypeSchema,
  movementPattern: movementPatternSchema,
  trackingType: trackingTypeSchema,
  isCustom: z.boolean(),
  isArchived: z.boolean(),
  notes: z.string(),
  createdAt: iso,
  updatedAt: iso,
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const templateSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  notes: z.string(),
  isArchived: z.boolean(),
  createdAt: iso,
  updatedAt: iso,
});
export type Template = z.infer<typeof templateSchema>;

export const templateExerciseSchema = z.object({
  id,
  templateId: id,
  exerciseId: id,
  order: z.number().int().nonnegative(),
  supersetId: z.string().nullable(),
  targetSets: z.number().int().positive(),
  repMin: z.number().int().positive(),
  repMax: z.number().int().positive(),
  targetRpe: z.number().min(1).max(10).nullable(),
  targetRir: z.number().min(0).max(10).nullable(),
  restSeconds: z.number().int().nonnegative(),
  includeWarmup: z.boolean(),
  notes: z.string(),
});
export type TemplateExercise = z.infer<typeof templateExerciseSchema>;

export const workoutSchema = z.object({
  id,
  templateId: id.nullable(),
  name: z.string().min(1),
  status: z.enum(workoutStatuses),
  startedAt: iso,
  completedAt: iso.nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  timezoneOffsetMinutes: z.number().int(),
  notes: z.string(),
  createdAt: iso,
  updatedAt: iso,
});
export type Workout = z.infer<typeof workoutSchema>;

export const workoutExerciseSchema = z.object({
  id,
  workoutId: id,
  exerciseId: id,
  order: z.number().int().nonnegative(),
  supersetId: z.string().nullable(),
  snapshotName: z.string(),
  snapshotPrimary: muscleGroupSchema,
  snapshotSecondary: z.array(muscleGroupSchema),
  snapshotEquipment: equipmentTypeSchema,
  snapshotPattern: movementPatternSchema,
  snapshotTracking: trackingTypeSchema,
  restSeconds: z.number().int().nonnegative(),
  includeWarmup: z.boolean(),
  notes: z.string(),
});
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

export const workoutSetSchema = z.object({
  id,
  workoutExerciseId: id,
  setIndex: z.number().int().nonnegative(),
  classification: z.enum(setClassifications),
  weightKg: z.number().nonnegative().nullable(),
  reps: z.number().int().nonnegative().nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  distanceMeters: z.number().nonnegative().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  rir: z.number().min(0).max(10).nullable(),
  completedAt: iso.nullable(),
  isCompleted: z.boolean(),
});
export type WorkoutSet = z.infer<typeof workoutSetSchema>;

export const bodyMeasurementSchema = z.object({
  id,
  metric: z.enum(measurementMetrics),
  valueCanonical: z.number().positive(),
  measuredAt: iso,
  notes: z.string(),
  createdAt: iso,
});
export type BodyMeasurement = z.infer<typeof bodyMeasurementSchema>;

export const barSchema = z.object({
  id,
  name: z.string().min(1),
  weightKg: z.number().positive(),
  kind: z.enum(barKinds),
});
export type Bar = z.infer<typeof barSchema>;

export const plateSchema = z.object({
  denominationKg: z.number().positive(),
  count: z.number().int().nonnegative(),
});
export type PlateStock = z.infer<typeof plateSchema>;

export const equipmentProfileSchema = z.object({
  id: z.literal("default"),
  bars: z.array(barSchema).min(1),
  plates: z.array(plateSchema),
  collarWeightKg: z.number().nonnegative(),
  activeBarId: id,
});
export type EquipmentProfile = z.infer<typeof equipmentProfileSchema>;

export const prefsSchema = z.object({
  id: z.literal("singleton"),
  units: z.enum(unitSystems),
  theme: z.enum(themes),
  oneRmFormula: z.enum(oneRmFormulas),
  secondaryVolumeFactor: z.number().min(0).max(1),
  appIcon: z.enum(appIcons),
  restBeep: z.boolean(),
  restVibrate: z.boolean().default(false),
  onboardingDone: z.boolean().default(false),
  updatedAt: iso,
});
export type Prefs = z.infer<typeof prefsSchema>;

export const VAULT_SCHEMA_VERSION = 1;

export const vaultDumpSchema = z.object({
  schemaVersion: z.number().int().positive(),
  exportedAt: iso,
  brand: z.literal("knurl-os"),
  exercises: z.array(exerciseSchema),
  templates: z.array(templateSchema),
  templateExercises: z.array(templateExerciseSchema),
  workouts: z.array(workoutSchema),
  workoutExercises: z.array(workoutExerciseSchema),
  workoutSets: z.array(workoutSetSchema),
  bodyMeasurements: z.array(bodyMeasurementSchema),
  equipmentProfile: equipmentProfileSchema,
  prefs: prefsSchema,
});
export type VaultDump = z.infer<typeof vaultDumpSchema>;

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  quadriceps: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  adductors: "Adductors",
  chest: "Chest",
  lats: "Lats",
  upper_back: "Upper back",
  traps: "Traps",
  spinal_erectors: "Spinal erectors",
  front_delts: "Front delts",
  side_delts: "Side delts",
  rear_delts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abdominals: "Abdominals",
  obliques: "Obliques",
  neck: "Neck",
};

export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  cable: "Cable",
  machine: "Machine",
  bodyweight: "Bodyweight",
  specialty_bar: "Specialty bar",
};

export const PATTERN_LABEL: Record<MovementPattern, string> = {
  squat: "Squat",
  hinge: "Hinge",
  push: "Push",
  pull: "Pull",
  carry: "Carry",
  isolation: "Isolation",
};

export const METRIC_LABEL: Record<MeasurementMetric, string> = {
  bodyweight: "Body weight",
  arms: "Arms",
  chest: "Chest",
  waist: "Waist",
  hips: "Hips",
  thighs: "Thighs",
  calves: "Calves",
  shoulders: "Shoulders",
  neck: "Neck",
};

export const VOLUME_BUCKET: Record<MuscleGroup, string> = {
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  adductors: "Adductors",
  chest: "Chest",
  lats: "Back",
  upper_back: "Back",
  traps: "Back",
  spinal_erectors: "Back",
  front_delts: "Shoulders",
  side_delts: "Shoulders",
  rear_delts: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abdominals: "Core",
  obliques: "Core",
  neck: "Neck",
};

export const SET_CLASS_META: Record<SetClassification, { short: string; label: string }> = {
  working: { short: "", label: "Working" },
  warmup: { short: "W", label: "Warm-up" },
  drop: { short: "D", label: "Drop" },
  failure: { short: "F", label: "Failure" },
};

export const SET_CLASS_CYCLE: SetClassification[] = ["working", "warmup", "drop", "failure"];

