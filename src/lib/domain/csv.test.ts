import { describe, expect, it } from "vitest";
import {
  classifySet,
  mapHeaders,
  parseCsvText,
  parseStrongCsv,
  rowFingerprint,
} from "./csv";

const SAMPLE = `Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Weight Unit,Reps,RPE,Notes
2024-03-02 18:00:00,Upper A,61m,Barbell Bench Press,1,60,kg,8,,warmup
2024-03-02 18:00:00,Upper A,61m,Barbell Bench Press,2,100,kg,5,8.0,
2024-03-02 18:00:00,Upper A,61m,Pendlay Row,1,80,kg,5,7.5,"belt"
`;

describe("csv parser", () => {
  it("parses quoted commas", () => {
    const table = parseCsvText(`a,b\n"1,2",3`);
    expect(table[1]).toEqual(["1,2", "3"]);
  });

  it("auto-maps Strong headers", () => {
    const mapping = mapHeaders([
      "Date",
      "Workout Name",
      "Exercise Name",
      "Set Order",
      "Weight",
      "Weight Unit",
      "Reps",
      "RPE",
    ]);
    expect(mapping).toEqual([
      "date",
      "workoutName",
      "exerciseName",
      "setOrder",
      "weight",
      "weightUnit",
      "reps",
      "rpe",
    ]);
  });

  it("reports row-level issues and keeps valid rows", () => {
    const result = parseStrongCsv(
      SAMPLE + `\n2024-03-02 18:00:00,Upper A,61m,,1,100,kg,5,,`,
    );
    expect(result.rows).toHaveLength(3);
    expect(result.issues.some((i) => i.message.includes("Missing exercise name"))).toBe(true);
    expect(result.rows[1]?.weight).toBe(100);
    expect(result.rows[1]?.weightUnit).toBe("kg");
  });

  it("fingerprints rows for duplicate avoidance", () => {
    const result = parseStrongCsv(SAMPLE);
    const a = rowFingerprint(result.rows[1]!);
    const b = rowFingerprint(result.rows[1]!);
    expect(a).toBe(b);
    expect(a).toContain("Barbell Bench Press");
  });

  it("classifies set types defensively", () => {
    expect(classifySet("Warm-up")).toBe("warmup");
    expect(classifySet("Drop set")).toBe("drop");
    expect(classifySet("Failure")).toBe("failure");
    expect(classifySet(null)).toBe("working");
  });

  it("rejects empty files", () => {
    const result = parseStrongCsv("   ");
    expect(result.rows).toHaveLength(0);
    expect(result.issues[0]?.message).toMatch(/empty/i);
  });
});
