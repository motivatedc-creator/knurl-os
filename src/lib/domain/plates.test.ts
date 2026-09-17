import { describe, expect, it } from "vitest";
import { defaultEquipment } from "./equipment";
import { formatStack, solveLoad } from "./plates";

const kg = defaultEquipment("kg");
const profile = {
  barWeightKg: 20,
  collarWeightKg: 2.5,
  plates: kg.plates,
};

describe("solveLoad", () => {
  it("loads a classic 100 kg with collars as 20 + 2.5 + 2×(25+10+2.5+1.25)", () => {
    const sol = solveLoad(100, profile);
    expect(sol.exact).toBe(true);
    expect(sol.actualKg).toBeCloseTo(100);
    expect(sol.perSide.map((p) => p.denominationKg)).toEqual([25, 10, 2.5, 1.25]);
    expect(sol.perSide.map((p) => p.count)).toEqual([1, 1, 1, 1]);
    expect(formatStack(sol.perSide)).toBe("1×25 + 1×10 + 1×2.5 + 1×1.25");
  });

  it("returns bar + collars when the target is at or below base", () => {
    const sol = solveLoad(20, profile);
    expect(sol.actualKg).toBeCloseTo(22.5);
    expect(sol.perSide).toEqual([]);
  });

  it("enforces side symmetry and never uses an odd leftover plate", () => {
    const tight = {
      barWeightKg: 20,
      collarWeightKg: 0,
      plates: [{ denominationKg: 20, count: 1 }, { denominationKg: 10, count: 4 }],
    };
    const sol = solveLoad(60, tight);
    expect(sol.actualKg).toBeLessThanOrEqual(60);
    for (const p of sol.perSide) {
      expect(p.count * 2).toBeLessThanOrEqual(
        tight.plates.find((s) => s.denominationKg === p.denominationKg)!.count,
      );
    }
  });

  it("reports the closest lower load when the exact target is impossible", () => {
    const limited = {
      barWeightKg: 20,
      collarWeightKg: 0,
      plates: [
        { denominationKg: 25, count: 2 },
        { denominationKg: 10, count: 2 },
      ],
    };
    const sol = solveLoad(67.5, limited);
    expect(sol.exact).toBe(false);
    expect(sol.actualKg).toBeLessThan(67.5);
    expect(sol.deltaKg).toBeLessThan(0);
    expect(sol.actualKg).toBeCloseTo(40);
  });

  it("orders the stack heaviest inside to lightest outside", () => {
    const sol = solveLoad(180, profile);
    const dens = sol.perSide.map((p) => p.denominationKg);
    const sorted = [...dens].sort((a, b) => b - a);
    expect(dens).toEqual(sorted);
  });

  it("prefers fewer plates via greedy heavy-first", () => {
    const sol = solveLoad(70, { barWeightKg: 20, collarWeightKg: 0, plates: profile.plates });
    expect(sol.exact).toBe(true);
    expect(sol.actualKg).toBeCloseTo(70);
    expect(sol.perSide[0]?.denominationKg).toBe(25);
  });
});
