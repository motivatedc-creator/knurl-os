import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/drawer";
import { useTemplates } from "@/lib/hooks";
import { duplicateTemplate, startFromTemplate, vault } from "@/lib/storage/repo";
import { nowIso } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/routines")({
  component: RoutinesPage,
});

function RoutinesPage() {
  const templates = useTemplates();
  const navigate = useNavigate();

  async function create() {
    const id = crypto.randomUUID();
    try {
      await vault.saveTemplate(
        {
          id,
          name: "Untitled routine",
          notes: "",
          isArchived: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        [],
      );
      await navigate({ to: "/routines/$id", params: { id } });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not write routine.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Routines</p>
          <h1 className="font-display text-5xl tracking-[0.08em]">TEMPLATES</h1>
        </div>
        <Button onClick={create} data-testid="new-routine">
          New routine
        </Button>
      </header>
      <ul className="flex flex-col gap-2">
        {templates.map((t) => (
          <li key={t.id}>
            <Panel className="flex items-center justify-between gap-3 p-4">
              <button
                type="button"
                className="text-left"
                onClick={() => navigate({ to: "/routines/$id", params: { id: t.id } })}
              >
                <p className="font-medium">{t.name}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-steel">
                  {t.exercises.length} movements
                </p>
              </button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="steel"
                  onClick={async () => {
                    const next = await duplicateTemplate(t.id);
                    toast("Routine copied.");
                    navigate({ to: "/routines/$id", params: { id: next } });
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="oxide"
                  data-testid={`launch-${t.name}`}
                  onClick={async () => {
                    await startFromTemplate(t.id);
                    navigate({ to: "/session" });
                  }}
                >
                  Launch
                </Button>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
}
