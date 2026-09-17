import { describe, expect, it } from "vitest";
import { defaultEquipment } from "./equipment";
import { generateWarmup } from "./warmup";

const profile = {
  barWeightKg: 20,
  collarWeightKg: 2.5,
  plates: defaultEquipment("kg").plates,
};

describe("generateWarmup", () => {
  it("builds a monotonic ramp below the working load", () => {
    const steps = generateWarmup(150, profile);
    expect(steps.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]!.weightKg).toBeGreaterThan(steps[i - 1]!.weightKg);
    }
    expect(steps.at(-1)!.weightKg).toBeLessThan(150);
  });

  it("includes a 90% single only on heavy loads", () => {
    const heavy = generateWarmup(160, profile);
    const light = generateWarmup(60, profile);
    expect(heavy.some((s) => s.percent === 0.9)).toBe(true);
    expect(light.some((s) => s.percent === 0.9)).toBe(false);
  });

  it("deduplicates loads that round to the same inventory weight", () => {
    const steps = generateWarmup(40, profile);
    const loads = steps.map((s) => s.weightKg);
    expect(new Set(loads).size).toBe(loads.length);
  });

  it("starts from the empty bar", () => {
    const steps = generateWarmup(120, profile);
    expect(steps[0]?.percent).toBeNull();
    expect(steps[0]?.weightKg).toBe(20);
    expect(steps[0]?.reps).toBe(8);
  });

  it("returns nothing when the working load is the bar", () => {
    expect(generateWarmup(20, profile)).toEqual([]);
  });
});
