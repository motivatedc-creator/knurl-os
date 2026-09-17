import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  EQUIPMENT_LABEL,
  MUSCLE_LABEL,
  equipmentTypes,
  muscleGroups,
  type EquipmentType,
  type Exercise,
  type MuscleGroup,
} from "@/lib/domain/schema";
import { cn } from "@/lib/utils";

export function ExercisePicker({
  open,
  onOpenChange,
  exercises,
  onSelect,
  title = "Catalog",
  recentIds = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  title?: string;
  recentIds?: string[];
}) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState<EquipmentType | "all">("all");
  const recentRank = useMemo(() => new Map(recentIds.map((id, i) => [id, i])), [recentIds]);

  const ordered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const live = exercises.filter((e) => !e.isArchived);
    const filtered = live.filter((e) => {
      if (muscle !== "all" && e.primaryMuscleGroup !== muscle) return false;
      if (equipment !== "all" && e.equipmentType !== equipment) return false;
      if (!needle) return true;
      const hay = `${e.name} ${e.primaryMuscleGroup} ${e.equipmentType} ${e.movementPattern}`.toLowerCase();
      return hay.includes(needle);
    });
    return filtered.sort((a, b) => {
      const ra = recentRank.has(a.id) ? recentRank.get(a.id)! : Number.POSITIVE_INFINITY;
      const rb = recentRank.has(b.id) ? recentRank.get(b.id)! : Number.POSITIVE_INFINITY;
      return ra - rb || a.name.localeCompare(b.name);
    });
  }, [exercises, q, muscle, equipment, recentRank]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} className="flex max-h-[80dvh] flex-col">
        <Input
          autoFocus
          placeholder="Search name, muscle, implement"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="exercise-search"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            aria-label="Filter by muscle"
            className="h-11 rounded-md border border-hairline bg-inset px-2 text-sm"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value as MuscleGroup | "all")}
          >
            <option value="all">All muscles</option>
            {muscleGroups.map((m) => (
              <option key={m} value={m}>
                {MUSCLE_LABEL[m]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by equipment"
            className="h-11 rounded-md border border-hairline bg-inset px-2 text-sm"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as EquipmentType | "all")}
          >
            <option value="all">All implements</option>
            {equipmentTypes.map((m) => (
              <option key={m} value={m}>
                {EQUIPMENT_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-3 max-h-[24rem] divide-y divide-hairline overflow-y-auto">
          {ordered.map((ex) => {
            const recent = recentRank.has(ex.id);
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left hover:bg-elevated",
                  )}
                  onClick={() => {
                    onSelect(ex);
                    onOpenChange(false);
                    setQ("");
                    setMuscle("all");
                    setEquipment("all");
                  }}
                  data-testid={`pick-${ex.name}`}
                >
                  <span>
                    <span className="block text-sm font-medium">{ex.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-steel">
                      {MUSCLE_LABEL[ex.primaryMuscleGroup]} · {EQUIPMENT_LABEL[ex.equipmentType]}
                    </span>
                  </span>
                  {recent && !q ? (
                    <span className="text-[10px] uppercase tracking-[0.16em] text-oxide">Recent</span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {!ordered.length ? (
            <li className="py-8 text-center text-sm text-steel">No matches in the catalog.</li>
          ) : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
