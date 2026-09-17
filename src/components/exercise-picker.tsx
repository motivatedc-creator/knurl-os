import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EQUIPMENT_LABEL, MUSCLE_LABEL, type Exercise } from "@/lib/domain/schema";
import { cn } from "@/lib/utils";

export function ExercisePicker({
  open,
  onOpenChange,
  exercises,
  onSelect,
  title = "Catalog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  title?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const live = exercises.filter((e) => !e.isArchived);
    if (!needle) return live;
    return live.filter((e) => {
      const hay = `${e.name} ${e.primaryMuscleGroup} ${e.equipmentType} ${e.movementPattern}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [exercises, q]);

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
        <ul className="mt-3 max-h-[24rem] divide-y divide-hairline overflow-y-auto">
          {filtered.map((ex) => (
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
                }}
                data-testid={`pick-${ex.name}`}
              >
                <span>
                  <span className="block text-sm font-medium">{ex.name}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-steel">
                    {MUSCLE_LABEL[ex.primaryMuscleGroup]} · {EQUIPMENT_LABEL[ex.equipmentType]}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!filtered.length ? (
            <li className="py-8 text-center text-sm text-steel">No matches in the catalog.</li>
          ) : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
