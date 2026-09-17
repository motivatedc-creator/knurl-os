import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/drawer";
import { csvSafeCell } from "@/lib/domain/csv";
import { VAULT_SCHEMA_VERSION } from "@/lib/domain/schema";
import { vault } from "@/lib/storage/repo";
import { getDb } from "@/lib/storage/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/vault")({
  component: VaultPage,
});

function VaultPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [pending, setPending] = useState<File | null>(null);

  async function exportJson() {
    const dump = await vault.exportVault();
    download(`knurl-os-vault-${dump.exportedAt.slice(0, 10)}.json`, JSON.stringify(dump, null, 2), "application/json");
    toast("Vault exported.");
  }

  async function exportCsv() {
    const workouts = await vault.listWorkouts();
    const lines = [
      "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Weight Unit,Reps,RPE,Notes",
    ];
    for (const w of workouts.filter((x) => x.status === "completed")) {
      const full = await vault.getWorkout(w.id);
      if (!full) continue;
      for (const ex of full.exercises) {
        for (const set of ex.sets) {
          lines.push(
            [
              csvSafeCell(w.startedAt),
              csvSafeCell(w.name),
              csvSafeCell(String(w.durationSeconds ?? "")),
              csvSafeCell(ex.snapshotName),
              csvSafeCell(String(set.setIndex + 1)),
              csvSafeCell(String(set.weightKg ?? "")),
              "kg",
              csvSafeCell(String(set.reps ?? "")),
              csvSafeCell(String(set.rpe ?? "")),
              csvSafeCell(set.classification),
            ].join(","),
          );
        }
      }
    }
    download(`knurl-os-log-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"), "text/csv");
    toast("CSV exported.");
  }

  async function restore(file: File, restoreMode: "merge" | "replace") {
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text());
      await vault.restoreVault(parsed, restoreMode);
      toast(restoreMode === "merge" ? "Vault merged. Existing ids kept." : "Vault restored.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Vault</p>
        <h1 className="font-display text-5xl tracking-[0.08em]">PORTABILITY</h1>
        <p className="mt-2 max-w-md text-sm text-steel">
          Schema {VAULT_SCHEMA_VERSION}. All writes stay on this device. Merge keeps current rows;
          replace overwrites the local vault.
        </p>
      </header>
      <Panel className="flex flex-col gap-3">
        <Button onClick={exportJson} data-testid="export-json">
          Export JSON vault
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          Export CSV log
        </Button>
        <div className="flex gap-2">
          {(["merge", "replace"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "h-10 flex-1 rounded-md text-xs uppercase tracking-[0.14em]",
                mode === m ? "bg-chalk text-mill" : "bg-elevated text-steel",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (mode === "replace") setPending(file);
            else void restore(file, "merge");
          }}
        />
        <Button variant="oxide" disabled={busy} onClick={() => fileRef.current?.click()}>
          {mode === "merge" ? "Merge from JSON" : "Replace from JSON"}
        </Button>
      </Panel>
      <p className="text-[11px] text-steel">
        Database: {typeof indexedDB === "undefined" ? "unavailable" : getDb().name}
      </p>
      {pending ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-mill/70 p-4 md:place-items-center">
          <Panel className="w-full max-w-md p-5">
            <h3 className="font-display text-3xl tracking-[0.1em]">REPLACE VAULT</h3>
            <p className="mt-2 text-sm text-steel">
              This overwrites every workout, routine and measurement on this device. Export first if
              you need a copy.
            </p>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" variant="oxide" disabled={busy} onClick={() => restore(pending, "replace")}>
                Replace
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function download(name: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
