import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/drawer";
import { METRIC_LABEL, measurementMetrics, type MeasurementMetric } from "@/lib/domain/schema";
import { parseDecimal, toCanonicalCm, toCanonicalKg, toDisplayLength, toDisplayWeight } from "@/lib/domain/units";
import { formatClock } from "@/lib/format";
import { useVaultQuery } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { vault } from "@/lib/storage/repo";
import { newId, nowIso } from "@/lib/utils";

export const Route = createFileRoute("/_app/biometrics")({
  component: BiometricsPage,
});

function BiometricsPage() {
  const units = usePrefs((s) => s.units);
  const rows = useVaultQuery(() => vault.listMeasurements()) ?? [];
  const [metric, setMetric] = useState<MeasurementMetric>("bodyweight");
  const [value, setValue] = useState("");

  const latest = new Map<MeasurementMetric, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.metric)) latest.set(row.metric, row);
  }

  function weeklyDelta(m: MeasurementMetric): number | null {
    const series = rows.filter((r) => r.metric === m).slice(0, 14);
    if (series.length < 2) return null;
    const newest = series[0]!;
    const weekAgo = Date.parse(newest.measuredAt) - 7 * 86400000;
    const prev = series.find((r) => Date.parse(r.measuredAt) <= weekAgo) ?? series.at(-1);
    if (!prev) return null;
    return newest.valueCanonical - prev.valueCanonical;
  }

  async function add() {
    const n = parseDecimal(value);
    if (n == null || n <= 0) {
      toast("Enter a positive measurement.");
      return;
    }
    const canonical = metric === "bodyweight" ? toCanonicalKg(n, units) : toCanonicalCm(n, units);
    await vault.addMeasurement({
      id: newId(),
      metric,
      valueCanonical: canonical,
      measuredAt: nowIso(),
      notes: "",
      createdAt: nowIso(),
    });
    setValue("");
    toast("Measurement stored.");
  }

  const display = (m: MeasurementMetric, canonical: number) =>
    m === "bodyweight"
      ? `${toDisplayWeight(canonical, units).toFixed(1)} ${units}`
      : units === "lb"
        ? `${toDisplayLength(canonical, units).toFixed(1)} in`
        : `${canonical.toFixed(1)} cm`;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Biometrics</p>
        <h1 className="font-display text-5xl tracking-[0.08em]">BODY</h1>
      </header>
      <Panel className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.16em] text-steel">Metric</span>
          <select
            className="h-12 rounded-md border border-hairline bg-inset px-3"
            value={metric}
            onChange={(e) => setMetric(e.target.value as MeasurementMetric)}
          >
            {measurementMetrics.map((m) => (
              <option key={m} value={m}>
                {METRIC_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.16em] text-steel">
            Value ({metric === "bodyweight" ? units : units === "lb" ? "in" : "cm"})
          </span>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            data-testid="bio-value"
          />
        </label>
        <Button onClick={add} data-testid="bio-save">
          Write measurement
        </Button>
      </Panel>
      <ul className="grid gap-2 sm:grid-cols-2">
        {measurementMetrics.map((m) => {
          const row = latest.get(m);
          const delta = weeklyDelta(m);
          return (
            <li key={m}>
              <Panel className="p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-steel">{METRIC_LABEL[m]}</p>
                <p className="font-display text-3xl tabular-nums">
                  {row ? display(m, row.valueCanonical) : "—"}
                </p>
                <p className="text-[11px] text-steel">
                  {delta == null
                    ? "Need a prior week"
                    : `${delta >= 0 ? "+" : ""}${display(m, Math.abs(delta)).replace(/^-/, "")} / 7d`}
                </p>
              </Panel>
            </li>
          );
        })}
      </ul>
      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.2em] text-steel">History</h2>
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {rows.slice(0, 20).map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {METRIC_LABEL[r.metric]} · {display(r.metric, r.valueCanonical)}
                <span className="block text-[11px] text-steel">{formatClock(r.measuredAt)}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => vault.deleteMeasurement(r.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
