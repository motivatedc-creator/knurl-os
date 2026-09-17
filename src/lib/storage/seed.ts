import { defaultEquipment, defaultPrefs } from "@/lib/domain/equipment";
import { starterExercises } from "@/lib/domain/exercises";
import { starterTemplates } from "@/lib/domain/templates";
import { getDb } from "./db";

let opening: Promise<void> | null = null;

export function openVault(): Promise<void> {
  if (!opening) {
    opening = actuallyOpen().catch((err) => {
      opening = null;
      throw err;
    });
  }
  return opening;
}

async function actuallyOpen(): Promise<void> {
  const db = getDb();
  await db.open();

  const exerciseCount = await db.exercises.count();
  if (exerciseCount === 0) {
    await db.exercises.bulkAdd(starterExercises());
  }
  const templateCount = await db.templates.count();
  if (templateCount === 0) {
    const { templates, exercises } = starterTemplates();
    await db.templates.bulkAdd(templates);
    await db.templateExercises.bulkAdd(exercises);
  }
  if (!(await db.equipment.get("default"))) {
    await db.equipment.add(defaultEquipment("kg"));
  }
  if (!(await db.prefs.get("singleton"))) {
    await db.prefs.add(defaultPrefs());
  }
}
