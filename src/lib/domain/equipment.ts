import type { EquipmentProfile, Prefs } from "./schema";
import { nowIso } from "@/lib/utils";

export const DEFAULT_BARS = [
  { id: "bar-oly-20", name: "Olympic 20 kg", weightKg: 20, kind: "olympic_20" as const },
  { id: "bar-oly-15", name: "Olympic 15 kg", weightKg: 15, kind: "olympic_15" as const },
  { id: "bar-hex", name: "Hex bar", weightKg: 25, kind: "hex" as const },
  { id: "bar-ssb", name: "Safety squat bar", weightKg: 30, kind: "ssb" as const },
];

export const DEFAULT_PLATES_KG = [
  { denominationKg: 25, count: 8 },
  { denominationKg: 20, count: 8 },
  { denominationKg: 15, count: 4 },
  { denominationKg: 10, count: 4 },
  { denominationKg: 5, count: 4 },
  { denominationKg: 2.5, count: 4 },
  { denominationKg: 1.25, count: 4 },
];

export const DEFAULT_PLATES_LB = [
  { denominationKg: 20.411655, count: 8 }, // 45 lb
  { denominationKg: 15.875732, count: 4 }, // 35 lb
  { denominationKg: 11.339809, count: 6 }, // 25 lb
  { denominationKg: 4.535924, count: 6 }, // 10 lb
  { denominationKg: 2.267962, count: 6 }, // 5 lb
  { denominationKg: 1.133981, count: 4 }, // 2.5 lb
];

export function defaultEquipment(units: "kg" | "lb" = "kg"): EquipmentProfile {
  return {
    id: "default",
    bars: DEFAULT_BARS.map((b) =>
      units === "lb" && b.kind === "olympic_20"
        ? { ...b, name: "Olympic 45 lb", weightKg: 20.411655 }
        : b,
    ),
    plates: units === "lb" ? DEFAULT_PLATES_LB : DEFAULT_PLATES_KG,
    collarWeightKg: units === "lb" ? 2.5 / 2.20462262185 : 2.5,
    activeBarId: "bar-oly-20",
  };
}

export function defaultPrefs(): Prefs {
  return {
    id: "singleton",
    units: "kg",
    theme: "mill",
    oneRmFormula: "epley",
    secondaryVolumeFactor: 0.5,
    appIcon: "mark",
    restBeep: false,
    restVibrate: false,
    onboardingDone: false,
    updatedAt: nowIso(),
  };
}

export function plateLabel(denominationKg: number, units: "kg" | "lb"): string {
  if (units === "kg") {
    const n = Number(denominationKg.toFixed(2));
    return Number.isInteger(n) ? `${n}` : String(n);
  }
  const lb = denominationKg * 2.20462262185;
  const n = Math.round(lb * 2) / 2;
  return Number.isInteger(n) ? `${n}` : String(n);
}
