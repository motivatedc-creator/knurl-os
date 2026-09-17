import { differenceInCalendarDays, parseISO } from "date-fns";

/** Consecutive training-day streak. A missed calendar day breaks it.
 *  If today is empty, yesterday may still carry the streak. */
export function computeStreak(completedDayKeys: string[], todayKey: string): number {
  const unique = [...new Set(completedDayKeys)].sort();
  if (!unique.length) return 0;
  const set = new Set(unique);
  const start = set.has(todayKey) ? todayKey : previousDay(todayKey);
  if (!set.has(start) && start !== todayKey) return 0;
  if (!set.has(start)) return 0;

  let count = 0;
  let cursor = start;
  while (set.has(cursor)) {
    count += 1;
    cursor = previousDay(cursor);
  }
  return count;
}

function previousDay(key: string): string {
  const d = parseISO(`${key}T12:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(differenceInCalendarDays(parseISO(`${a}T12:00:00`), parseISO(`${b}T12:00:00`)));
}
