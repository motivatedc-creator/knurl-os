import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PlateStack } from "@/components/plates/stack";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/drawer";
import { solveLoad, type LoadProfile } from "@/lib/domain/plates";
import { generateWarmup } from "@/lib/domain/warmup";
import { parseDecimal, toCanonicalKg, toDisplayWeight } from "@/lib/domain/units";
import { formatLoad } from "@/lib/format";
import { useEquipment } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";

export const Route = createFileRoute("/_app/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  const equipment = useEquipment();
  const units = usePrefs((s) => s.units);
  const [loadText, setLoadText] = useState("100");
  const profile: LoadProfile | null = equipment
    ? {
        barWeightKg: equipment.bars.find((b) => b.id === equipment.activeBarId)?.weightKg ?? 20,
        collarWeightKg: equipment.collarWeightKg,
        plates: equipment.plates,
      }
    : null;
  const target = useMemo(() => {
    const n = parseDecimal(loadText);
    return n == null ? null : toCanonicalKg(n, units);
  }, [loadText, units]);
  const solution = profile && target != null ? solveLoad(target, profile) : null;
  const ramp = profile && target != null ? generateWarmup(target, profile) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plate calculator"
        subtitle="Uses the plates you actually own. It will not invent discs."
      />
      <Panel className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-steel">Target weight ({units})</span>
          <Input value={loadText} onChange={(e) => setLoadText(e.target.value)} inputMode="decimal" />
        </label>
        {solution ? (
          <>
            <p className="font-display text-5xl tabular-nums tracking-wide">
              {formatLoad(solution.actualKg, units)}
              <span className="ml-2 text-xl text-steel">{units}</span>
            </p>
            {!solution.exact ? (
              <p className="text-sm text-oxide">
                Nearest inventory load. Delta {solution.deltaKg.toFixed(1)} kg.
              </p>
            ) : (
              <p className="text-sm text-steel">Exact match. Bar plus collars plus plates.</p>
            )}
            <PlateStack solution={solution} units={units} />
          </>
        ) : (
          <p className="text-sm text-steel">Enter a load to resolve the stack.</p>
        )}
      </Panel>
      <Panel>
        <h2 className="mb-3 text-sm font-medium">Warm-up sets</h2>
        {ramp.length ? (
          <ol className="flex flex-col gap-2">
            {ramp.map((step, i) => (
              <li key={i} className="flex items-baseline justify-between border-b border-hairline py-2">
                <span className="text-xs text-steel">
                  {step.percent == null ? "Empty bar" : `${Math.round(step.percent * 100)}%`}
                </span>
                <span className="tabular-nums">
                  {formatLoad(step.weightKg, units)} {units} × {step.reps}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-steel">Enter a target weight to see the warm-up.</p>
        )}
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            const n = parseDecimal(loadText);
            if (n == null) return;
            setLoadText(String(n));
          }}
        >
          Recalculate
        </Button>
      </Panel>
    </div>
  );
}
