import { describe, expect, it } from "vitest";
import { computeStreak } from "./streak";

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-09-15", "2026-09-16", "2026-09-17"], "2026-09-17")).toBe(3);
  });

  it("keeps the streak if today is empty but yesterday is present", () => {
    expect(computeStreak(["2026-09-15", "2026-09-16"], "2026-09-17")).toBe(2);
  });

  it("breaks on a missed calendar day", () => {
    expect(computeStreak(["2026-09-14", "2026-09-16"], "2026-09-17")).toBe(1);
  });

  it("is zero with no sessions", () => {
    expect(computeStreak([], "2026-09-17")).toBe(0);
  });
});
