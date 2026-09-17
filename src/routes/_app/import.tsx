import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/drawer";
import { commitCsvImport, previewCsvImport, type ImportPreview } from "@/lib/storage/repo";

export const Route = createFileRoute("/_app/import")({
  component: ImportPage,
});

function ImportPage() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    const text = await file.text();
    setRaw(text);
    setPreview(await previewCsvImport(text));
  }

  async function commit() {
    if (!raw) return;
    setBusy(true);
    try {
      const result = await commitCsvImport(raw);
      toast(`Imported ${result.imported} sets · skipped ${result.skipped} duplicates.`);
      setPreview(null);
      setRaw("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Import from Strong"
        subtitle="Pick a CSV. You’ll see a preview before anything is saved."
      />
      <input
        type="file"
        accept=".csv,text/csv"
        data-testid="csv-file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      {preview ? (
        <Panel className="flex flex-col gap-3">
          <p className="text-sm">
            {preview.rows.length} rows · {preview.workoutCount} sessions · {preview.duplicateRows} duplicates ·{" "}
            {preview.newExerciseNames.length} new movements
          </p>
          {preview.issues.length ? (
            <ul className="max-h-40 overflow-auto text-sm text-oxide">
              {preview.issues.slice(0, 12).map((i) => (
                <li key={`${i.line}-${i.message}`}>
                  Line {i.line}: {i.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-steel">No parse faults.</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-[0.12em] text-steel">
                <tr>
                  <th className="py-2">Line</th>
                  <th>Date</th>
                  <th>Exercise</th>
                  <th>W</th>
                  <th>R</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((r) => (
                  <tr key={r.line} className="border-t border-hairline">
                    <td className="py-1">{r.line}</td>
                    <td>{r.date}</td>
                    <td>{r.exerciseName}</td>
                    <td>{r.weight}</td>
                    <td>{r.reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={commit} disabled={busy || preview.rows.length === 0} data-testid="csv-commit">
            Commit import
          </Button>
        </Panel>
      ) : null}
    </div>
  );
}
