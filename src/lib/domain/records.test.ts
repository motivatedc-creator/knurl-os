import { describe, expect, it } from "vitest";
import { computeExerciseRecords, findNewRecords, type RecordSet } from "./records";

function set(partial: Partial<RecordSet> & Pick<RecordSet, "id" | "weightKg" | "reps">): RecordSet {
  return {
    exerciseId: "squat",
    classification: "working",
    isCompleted: true,
    performedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("records", () => {
  it("tracks heaviest, 1RM, volume and rep brackets", () => {
    const map = computeExerciseRecords(
      [
        set({ id: "a", weightKg: 100, reps: 5, performedAt: "2026-01-01T00:00:00.000Z" }),
        set({ id: "b", weightKg: 120, reps: 1, performedAt: "2026-01-02T00:00:00.000Z" }),
        set({
          id: "c",
          weightKg: 140,
          reps: 5,
          classification: "warmup",
          performedAt: "2026-01-03T00:00:00.000Z",
        }),
      ],
      "epley",
    );
    const rec = map.get("squat")!;
    expect(rec.heaviestKg).toBe(120);
    expect(rec.bestOneRmKg).toBe(120);
    expect(rec.repMaxes.get(1)).toBe(120);
    expect(rec.repMaxes.get(5)).toBe(100);
  });

  it("flags sets that beat prior history, including intra-session", () => {
    const history = [set({ id: "old", weightKg: 100, reps: 5 })];
    const flags = findNewRecords(
      history,
      [
        set({ id: "n1", weightKg: 110, reps: 5, performedAt: "2026-02-01T00:00:00.000Z" }),
        set({ id: "n2", weightKg: 115, reps: 5, performedAt: "2026-02-01T00:05:00.000Z" }),
      ],
      "epley",
    );
    expect(flags.map((f) => f.setId)).toEqual(["n1", "n2"]);
    expect(flags[0]?.kinds).toContain("weight");
  });

  it("does not flag equal loads", () => {
    const flags = findNewRecords(
      [set({ id: "old", weightKg: 100, reps: 5 })],
      [set({ id: "n", weightKg: 100, reps: 5 })],
      "epley",
    );
    expect(flags).toEqual([]);
  });
});
