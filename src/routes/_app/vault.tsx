import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/drawer";
import { VAULT_SCHEMA_VERSION } from "@/lib/domain/schema";
import { vault } from "@/lib/storage/repo";
import { getDb } from "@/lib/storage/db";

export const Route = createFileRoute("/_app/vault")({
  component: VaultPage,
});

function VaultPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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
              w.startedAt,
              csv(w.name),
              w.durationSeconds ?? "",
              csv(ex.snapshotName),
              set.setIndex + 1,
              set.weightKg ?? "",
              "kg",
              set.reps ?? "",
              set.rpe ?? "",
              csv(set.classification),
            ].join(","),
          );
        }
      }
    }
    download(`knurl-os-log-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"), "text/csv");
    toast("CSV exported.");
  }

  async function restore(file: File) {
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text());
      await vault.restoreVault(parsed);
      toast("Vault restored.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Vault</p>
        <h1 className="font-display text-5xl tracking-[0.08em]">PORTABILITY</h1>
        <p className="mt-2 max-w-md text-sm text-steel">
          Schema {VAULT_SCHEMA_VERSION}. All writes stay on this device. Restore replaces the local vault.
        </p>
      </header>
      <Panel className="flex flex-col gap-3">
        <Button onClick={exportJson} data-testid="export-json">
          Export JSON vault
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          Export CSV log
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void restore(file);
          }}
        />
        <Button variant="oxide" disabled={busy} onClick={() => fileRef.current?.click()}>
          Restore from JSON
        </Button>
      </Panel>
      <p className="text-[11px] text-steel">
        Database: {typeof indexedDB === "undefined" ? "unavailable" : getDb().name}
      </p>
    </div>
  );
}

function csv(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
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
