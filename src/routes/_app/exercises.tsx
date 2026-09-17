import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/drawer";
import {
  EQUIPMENT_LABEL,
  MUSCLE_LABEL,
  equipmentTypes,
  muscleGroups,
  movementPatterns,
  type EquipmentType,
  type Exercise,
  type MovementPattern,
  type MuscleGroup,
} from "@/lib/domain/schema";
import { useExercises } from "@/lib/hooks";
import { vault } from "@/lib/storage/repo";
import { newId, nowIso } from "@/lib/utils";

export const Route = createFileRoute("/_app/exercises")({
  component: ExercisesPage,
});

function ExercisesPage() {
  const catalog = useExercises();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState<MuscleGroup>("chest");
  const [equipment, setEquipment] = useState<EquipmentType>("barbell");
  const [pattern, setPattern] = useState<MovementPattern>("push");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter((e) => !needle || e.name.toLowerCase().includes(needle));
  }, [catalog, q]);

  async function create() {
    if (!name.trim()) return;
    const row: Exercise = {
      id: newId(),
      name: name.trim(),
      primaryMuscleGroup: primary,
      secondaryMuscleGroups: [],
      equipmentType: equipment,
      movementPattern: pattern,
      trackingType: "weight_reps",
      isCustom: true,
      isArchived: false,
      notes: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await vault.upsertExercise(row);
    setName("");
    toast("Custom movement stored.");
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Catalog</p>
        <h1 className="font-display text-5xl tracking-[0.08em]">MOVEMENTS</h1>
      </header>
      <Input placeholder="Search catalog" value={q} onChange={(e) => setQ(e.target.value)} />
      <Panel className="flex flex-col gap-2 p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-steel">Custom movement</p>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <select className="h-12 rounded-md border border-hairline bg-inset px-2 text-sm" value={primary} onChange={(e) => setPrimary(e.target.value as MuscleGroup)}>
            {muscleGroups.map((m) => (
              <option key={m} value={m}>{MUSCLE_LABEL[m]}</option>
            ))}
          </select>
          <select className="h-12 rounded-md border border-hairline bg-inset px-2 text-sm" value={equipment} onChange={(e) => setEquipment(e.target.value as EquipmentType)}>
            {equipmentTypes.map((m) => (
              <option key={m} value={m}>{EQUIPMENT_LABEL[m]}</option>
            ))}
          </select>
          <select className="h-12 rounded-md border border-hairline bg-inset px-2 text-sm" value={pattern} onChange={(e) => setPattern(e.target.value as MovementPattern)}>
            {movementPatterns.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <Button onClick={create}>Add to catalog</Button>
      </Panel>
      <ul className="divide-y divide-hairline rounded-xl border border-hairline">
        {filtered.map((ex) => (
          <li key={ex.id} className="flex items-center justify-between px-4 py-3">
            <span>
              <span className="block text-sm font-medium">{ex.name}</span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-steel">
                {MUSCLE_LABEL[ex.primaryMuscleGroup]} · {EQUIPMENT_LABEL[ex.equipmentType]}
                {ex.isCustom ? " · custom" : ""}
              </span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => vault.upsertExercise({ ...ex, isArchived: !ex.isArchived, updatedAt: nowIso() })}
            >
              {ex.isArchived ? "Restore" : "Archive"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
