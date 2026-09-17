import { describe, expect, it } from "vitest";
import { attributeVolume, bucketVolume, setVolumeKg, workoutVolumeFromSets } from "./volume";

describe("volume", () => {
  it("is weight × reps", () => {
    expect(setVolumeKg(100, 5)).toBe(500);
  });

  it("credits 1.0 to primary and a configurable factor to secondary", () => {
    const out = attributeVolume(500, "chest", ["front_delts", "triceps"], 0.5);
    expect(out.chest).toBe(500);
    expect(out.front_delts).toBe(250);
    expect(out.triceps).toBe(250);
  });

  it("rolls muscles into display buckets", () => {
    const buckets = bucketVolume({ lats: 100, upper_back: 50, traps: 20 });
    expect(buckets.Back).toBe(170);
  });

  it("excludes warmup from workout tonnage", () => {
    const total = workoutVolumeFromSets([
      { weightKg: 60, reps: 8, classification: "warmup", isCompleted: true },
      { weightKg: 100, reps: 5, classification: "working", isCompleted: true },
      { weightKg: 90, reps: 5, classification: "working", isCompleted: false },
    ]);
    expect(total).toBe(500);
  });
});
