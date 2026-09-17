import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import type { UnitSystem } from "./domain/schema";
import { formatNumber, toDisplayWeight } from "./domain/units";

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds < 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatClock(iso: string): string {
  try {
    return format(parseISO(iso), "EEE d MMM · HH:mm");
  } catch {
    return iso;
  }
}

export function formatDay(iso: string): string {
  try {
    return format(parseISO(iso), "EEE d MMM");
  } catch {
    return iso;
  }
}

export function fromNow(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatLoad(kg: number | null | undefined, units: UnitSystem): string {
  if (kg == null) return "—";
  return `${formatNumber(toDisplayWeight(kg, units), 2)}`;
}

export function formatLoadUnit(kg: number | null | undefined, units: UnitSystem): string {
  if (kg == null) return "—";
  return `${formatNumber(toDisplayWeight(kg, units), 2)} ${units}`;
}

export function formatSet(weightKg: number | null, reps: number | null, units: UnitSystem): string {
  if (weightKg == null && reps == null) return "—";
  if (weightKg == null) return `${reps} r`;
  return `${formatLoad(weightKg, units)} × ${reps ?? "—"}`;
}
