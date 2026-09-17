import type { UnitSystem } from "./schema";

export const KG_TO_LB = 2.20462262185;
export const CM_TO_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

export function cmToIn(cm: number): number {
  return cm / CM_TO_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_TO_IN;
}

export function toDisplayWeight(kg: number, units: UnitSystem): number {
  return units === "lb" ? kgToLb(kg) : kg;
}

export function toCanonicalKg(display: number, units: UnitSystem): number {
  return units === "lb" ? lbToKg(display) : display;
}

export function toDisplayLength(cm: number, units: UnitSystem): number {
  return units === "lb" ? cmToIn(cm) : cm;
}

export function toCanonicalCm(display: number, units: UnitSystem): number {
  return units === "lb" ? inToCm(display) : display;
}

export function roundTo(value: number, increment: number): number {
  if (increment <= 0) return value;
  return Math.round(value / increment) * increment;
}

export function formatNumber(n: number, digits = 1): string {
  const rounded = Number(n.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits).replace(/\.?0+$/, (m) => (m.includes(".") ? m.replace(/0+$/, "").replace(/\.$/, "") : m));
}

export function formatWeight(kg: number, units: UnitSystem): string {
  const v = toDisplayWeight(kg, units);
  return `${formatNumber(v, 2)} ${units}`;
}

export function formatLength(cm: number, units: UnitSystem): string {
  const v = toDisplayLength(cm, units);
  return units === "lb" ? `${formatNumber(v, 2)} in` : `${formatNumber(v, 1)} cm`;
}

export function weightIncrement(units: UnitSystem): number {
  return units === "lb" ? 5 : 2.5;
}

export function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
