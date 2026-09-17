import { plateLabel } from "@/lib/domain/equipment";
import type { LoadSolution } from "@/lib/domain/plates";
import type { UnitSystem } from "@/lib/domain/schema";
import { cn } from "@/lib/utils";

function plateTone(kg: number): string {
  if (kg >= 24) return "bg-oxide text-chalk";
  if (kg >= 19) return "bg-chalk text-mill";
  if (kg >= 14) return "bg-steel text-mill";
  if (kg >= 9) return "bg-elevated text-chalk ring-1 ring-hairline-strong";
  return "bg-transparent text-chalk ring-1 ring-steel";
}

function plateSize(kg: number): string {
  if (kg >= 24) return "h-24 w-5";
  if (kg >= 19) return "h-20 w-5";
  if (kg >= 14) return "h-[4.25rem] w-4";
  if (kg >= 9) return "h-14 w-3.5";
  if (kg >= 4) return "h-11 w-3";
  return "h-9 w-2.5";
}

export function PlateStack({
  solution,
  units,
}: {
  solution: LoadSolution;
  units: UnitSystem;
}) {
  const discs: { kg: number; key: string }[] = [];
  solution.perSide.forEach((p, i) => {
    for (let n = 0; n < p.count; n++) {
      discs.push({ kg: p.denominationKg, key: `${i}-${n}` });
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-center gap-0.5 py-2">
        <div className="mb-2 h-3 w-8 rounded-sm bg-steel" title="Bar sleeve" />
        {discs.map((d) => (
          <div
            key={d.key}
            className={cn("rounded-[1px]", plateSize(d.kg), plateTone(d.kg))}
            title={`${plateLabel(d.kg, units)} ${units}`}
          />
        ))}
        <div className="mb-3 h-6 w-2 rounded-[1px] bg-hairline-strong" title="Collar" />
      </div>
      <p className="text-center text-[11px] uppercase tracking-[0.16em] text-steel">
        One side · heaviest inside
      </p>
    </div>
  );
}
