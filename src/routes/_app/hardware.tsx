import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/drawer";
import { defaultEquipment, plateLabel } from "@/lib/domain/equipment";
import type { EquipmentProfile } from "@/lib/domain/schema";
import { useEquipment } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { vault } from "@/lib/storage/repo";

export const Route = createFileRoute("/_app/hardware")({
  component: HardwarePage,
});

function HardwarePage() {
  const stored = useEquipment();
  const units = usePrefs((s) => s.units);
  const [profile, setProfile] = useState<EquipmentProfile | null>(null);

  useEffect(() => {
    if (stored) setProfile(stored);
  }, [stored]);

  if (!profile) return <p className="text-sm text-steel">Reading iron inventory…</p>;

  async function save(next: EquipmentProfile) {
    setProfile(next);
    await vault.saveEquipment(next);
    toast("Inventory written.");
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">Iron</p>
        <h1 className="font-display text-5xl tracking-[0.08em]">INVENTORY</h1>
        <p className="mt-2 max-w-md text-sm text-steel">
          Finite plate counts. The loader will not invent discs you do not own. Side symmetry is enforced.
        </p>
      </header>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => save(defaultEquipment(units))}
        >
          Load standard {units} set
        </Button>
      </div>
      <Panel>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-steel">Bars</h2>
        <ul className="flex flex-col gap-2">
          {profile.bars.map((bar) => (
            <li key={bar.id} className="flex items-center gap-2">
              <button
                type="button"
                className={`h-10 rounded-md px-3 text-xs uppercase tracking-[0.12em] ${
                  profile.activeBarId === bar.id ? "bg-chalk text-mill" : "bg-elevated text-steel"
                }`}
                onClick={() => save({ ...profile, activeBarId: bar.id })}
              >
                Active
              </button>
              <span className="flex-1 text-sm">{bar.name}</span>
              <Input
                className="h-10 w-24"
                type="number"
                value={bar.weightKg}
                onChange={(e) =>
                  save({
                    ...profile,
                    bars: profile.bars.map((b) =>
                      b.id === bar.id ? { ...b, weightKg: Number(e.target.value) } : b,
                    ),
                  })
                }
              />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-steel">
          Plates (total count, both sides)
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {profile.plates.map((p, i) => (
            <li key={p.denominationKg} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.14em] text-steel">
                {plateLabel(p.denominationKg, units)} {units}
              </span>
              <Input
                type="number"
                min={0}
                step={2}
                value={p.count}
                onChange={(e) => {
                  const plates = profile.plates.map((row, j) =>
                    j === i ? { ...row, count: Math.max(0, Number(e.target.value)) } : row,
                  );
                  save({ ...profile, plates });
                }}
              />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="flex items-center justify-between gap-3">
        <span className="text-sm">Collar pair weight (kg stored)</span>
        <Input
          className="w-28"
          type="number"
          step="0.25"
          value={profile.collarWeightKg}
          onChange={(e) => save({ ...profile, collarWeightKg: Number(e.target.value) })}
        />
      </Panel>
    </div>
  );
}
