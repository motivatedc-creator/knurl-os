import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExercisePicker } from "@/components/exercise-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/drawer";
import type { TemplateExercise } from "@/lib/domain/schema";
import { useExercises, useRecentExerciseIds, useVaultQuery } from "@/lib/hooks";
import { vault } from "@/lib/storage/repo";
import { newId, nowIso } from "@/lib/utils";

export const Route = createFileRoute("/_app/routines_/$id")({
  component: RoutineEditor,
});

function RoutineEditor() {
  const { id } = Route.useParams();
  const row = useVaultQuery(() => vault.getTemplate(id), [id]);
  const catalog = useExercises();
  const recentIds = useRecentExerciseIds();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<TemplateExercise[]>([]);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setNotes(row.notes);
    setLines(row.exercises);
    // Hydrate editor fields when the loaded template identity changes, not on every live-query object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  if (row === undefined) return <p className="text-sm text-steel">Reading routine…</p>;
  if (!row) return <p className="text-sm text-steel">Routine missing.</p>;

  const byId = new Map(catalog.map((e) => [e.id, e]));

  async function save() {
    await vault.saveTemplate(
      { ...row!, name: name.trim() || "Untitled routine", notes, updatedAt: nowIso(), createdAt: row!.createdAt, id, isArchived: false },
      lines.map((l, i) => ({ ...l, order: i, templateId: id })),
    );
    toast("Routine written.");
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...lines];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setLines(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <ExercisePicker
        open={picker}
        onOpenChange={setPicker}
        exercises={catalog}
        recentIds={recentIds}
        onSelect={(ex) => {
          setLines((prev) => [
            ...prev,
            {
              id: newId(),
              templateId: id,
              exerciseId: ex.id,
              order: prev.length,
              supersetId: null,
              targetSets: 3,
              repMin: 5,
              repMax: 8,
              targetRpe: 8,
              targetRir: null,
              restSeconds: 150,
              includeWarmup: prev.length === 0,
              notes: "",
            },
          ]);
        }}
      />
      <header className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Routine editor</p>
        <Button
          variant="ghost"
          onClick={async () => {
            await vault.deleteTemplate(id);
            navigate({ to: "/routines" });
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </header>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.16em] text-steel">Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="routine-name" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.16em] text-steel">Notes</span>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <ul className="flex flex-col gap-3">
        {lines.map((line, i) => {
          const ex = byId.get(line.exerciseId);
          return (
            <li key={line.id}>
              <Panel className="flex flex-col gap-3 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{ex?.name ?? "Unknown"}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(i, -1)} aria-label="Move up">
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => move(i, 1)} aria-label="Move down">
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setLines((p) => p.filter((x) => x.id !== line.id))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Num
                    label="Sets"
                    value={line.targetSets}
                    onChange={(n) => patch(i, { targetSets: n })}
                  />
                  <Num label="Rep min" value={line.repMin} onChange={(n) => patch(i, { repMin: n })} />
                  <Num label="Rep max" value={line.repMax} onChange={(n) => patch(i, { repMax: n })} />
                  <Num label="Rest s" value={line.restSeconds} onChange={(n) => patch(i, { restSeconds: n })} />
                  <Num
                    label="RPE"
                    value={line.targetRpe ?? 0}
                    onChange={(n) => patch(i, { targetRpe: n || null })}
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-steel">Superset</span>
                    <Input
                      value={line.supersetId ?? ""}
                      onChange={(e) => patch(i, { supersetId: e.target.value || null })}
                    />
                  </label>
                  <label className="col-span-2 flex items-center gap-2 pt-6 text-sm">
                    <input
                      type="checkbox"
                      checked={line.includeWarmup}
                      onChange={(e) => patch(i, { includeWarmup: e.target.checked })}
                    />
                    Inject ramp on launch
                  </label>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>

      <Button variant="outline" onClick={() => setPicker(true)} data-testid="routine-add-exercise">
        <Plus className="size-4" /> Add movement
      </Button>
      <Button onClick={save} data-testid="save-routine">
        Write routine
      </Button>
    </div>
  );

  function patch(index: number, p: Partial<TemplateExercise>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...p } : l)));
  }
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.16em] text-steel">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
