import { describe, expect, it } from "vitest";
import { estimate1RM, estimate1RMFromSets } from "./one-rm";

describe("estimate1RM", () => {
  it("returns the load for a single", () => {
    expect(estimate1RM(180, 1, "epley")).toBe(180);
    expect(estimate1RM(180, 1, "brzycki")).toBe(180);
  });

  it("applies Epley", () => {
    expect(estimate1RM(100, 5, "epley")).toBeCloseTo(100 * (1 + 5 / 30));
  });

  it("applies Brzycki", () => {
    expect(estimate1RM(100, 5, "brzycki")).toBeCloseTo((100 * 36) / 32);
  });

  it("guards Brzycki against reps >= 37", () => {
    expect(estimate1RM(60, 37, "brzycki")).toBeNull();
    expect(estimate1RM(60, 40, "brzycki")).toBeNull();
  });

  it("rejects non-positive inputs", () => {
    expect(estimate1RM(0, 5, "epley")).toBeNull();
    expect(estimate1RM(100, 0, "epley")).toBeNull();
    expect(estimate1RM(-10, 5, "epley")).toBeNull();
  });
});

describe("estimate1RMFromSets", () => {
  it("ignores warmup sets even when heavier in reps", () => {
    const best = estimate1RMFromSets(
      [
        { weightKg: 60, reps: 8, classification: "warmup", isCompleted: true },
        { weightKg: 100, reps: 5, classification: "working", isCompleted: true },
        { weightKg: 110, reps: 1, classification: "working", isCompleted: true },
      ],
      "epley",
    );
    expect(best).toBeCloseTo(100 * (1 + 5 / 30));
  });

  it("ignores incomplete sets", () => {
    const best = estimate1RMFromSets(
      [{ weightKg: 200, reps: 1, classification: "working", isCompleted: false }],
      "epley",
    );
    expect(best).toBeNull();
  });
});
