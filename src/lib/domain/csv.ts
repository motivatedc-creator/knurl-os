import { z } from "zod";

export type CsvColumn =
  | "date"
  | "workoutName"
  | "duration"
  | "exerciseName"
  | "setOrder"
  | "weight"
  | "weightUnit"
  | "reps"
  | "rpe"
  | "distance"
  | "seconds"
  | "notes"
  | "workoutNotes"
  | "setType"
  | "unknown";

const HEADER_MAP: Record<string, CsvColumn> = {
  date: "date",
  time: "date",
  datetime: "date",
  workoutname: "workoutName",
  workout: "workoutName",
  session: "workoutName",
  duration: "duration",
  exercisename: "exerciseName",
  exercise: "exerciseName",
  setorder: "setOrder",
  set: "setOrder",
  setnumber: "setOrder",
  weight: "weight",
  kg: "weight",
  lbs: "weight",
  weightunit: "weightUnit",
  unit: "weightUnit",
  reps: "reps",
  repetitions: "reps",
  rpe: "rpe",
  distance: "distance",
  seconds: "seconds",
  durationseconds: "seconds",
  notes: "notes",
  setnotes: "notes",
  workoutnotes: "workoutNotes",
  settype: "setType",
  type: "setType",
};

export function normalizeHeader(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function mapHeaders(headers: string[]): CsvColumn[] {
  return headers.map((h) => HEADER_MAP[normalizeHeader(h)] ?? "unknown");
}

export type CsvRow = {
  line: number;
  date: string | null;
  workoutName: string | null;
  duration: string | null;
  exerciseName: string | null;
  setOrder: number | null;
  weight: number | null;
  weightUnit: "kg" | "lb" | null;
  reps: number | null;
  rpe: number | null;
  distance: number | null;
  seconds: number | null;
  notes: string;
  workoutNotes: string;
  setType: string | null;
};

export type CsvIssue = { line: number; message: string };

export type CsvParseResult = {
  headers: string[];
  mapping: CsvColumn[];
  rows: CsvRow[];
  issues: CsvIssue[];
};

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushCell();
    } else if (ch === "\n") {
      pushCell();
      pushRow();
    } else if (ch === "\r") {
      continue;
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    pushCell();
    pushRow();
  }
  return rows;
}

function parseNum(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseUnit(raw: string | undefined): "kg" | "lb" | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (t === "kg" || t === "kgs" || t === "kilo" || t === "kilos") return "kg";
  if (t === "lb" || t === "lbs" || t === "pound" || t === "pounds") return "lb";
  return null;
}

const dateSchema = z.string().min(8);

export function parseStrongCsv(text: string): CsvParseResult {
  const table = parseCsvText(text.trim());
  const issues: CsvIssue[] = [];
  if (!table.length) {
    return { headers: [], mapping: [], rows: [], issues: [{ line: 0, message: "File is empty" }] };
  }
  const headers = table[0]!.map((h) => h.trim());
  const mapping = mapHeaders(headers);
  const col = (key: CsvColumn) => mapping.indexOf(key);

  const iDate = col("date");
  const iName = col("workoutName");
  const iDur = col("duration");
  const iEx = col("exerciseName");
  const iOrder = col("setOrder");
  const iWeight = col("weight");
  const iUnit = col("weightUnit");
  const iReps = col("reps");
  const iRpe = col("rpe");
  const iDist = col("distance");
  const iSec = col("seconds");
  const iNotes = col("notes");
  const iWNotes = col("workoutNotes");
  const iType = col("setType");

  if (iDate < 0) issues.push({ line: 1, message: "No date column could be mapped" });
  if (iEx < 0) issues.push({ line: 1, message: "No exercise name column could be mapped" });

  const rows: CsvRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const line = r + 1;
    const cells = table[r]!;
    const at = (idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");
    const exerciseName = at(iEx) || null;
    const dateRaw = at(iDate);
    const date = dateRaw ? dateRaw : null;
    if (date && !dateSchema.safeParse(date).success) {
      issues.push({ line, message: `Unreadable date "${dateRaw}"` });
    }
    if (!exerciseName) {
      issues.push({ line, message: "Missing exercise name" });
      continue;
    }
    const weight = parseNum(at(iWeight));
    const reps = parseNum(at(iReps));
    const rpe = parseNum(at(iRpe));
    if (at(iWeight) && weight == null) issues.push({ line, message: `Unreadable weight "${at(iWeight)}"` });
    if (at(iReps) && reps == null) issues.push({ line, message: `Unreadable reps "${at(iReps)}"` });

    rows.push({
      line,
      date,
      workoutName: at(iName) || "Imported",
      duration: at(iDur) || null,
      exerciseName,
      setOrder: parseNum(at(iOrder)),
      weight,
      weightUnit: parseUnit(at(iUnit)),
      reps: reps != null ? Math.round(reps) : null,
      rpe: rpe != null && rpe >= 1 && rpe <= 10 ? rpe : null,
      distance: parseNum(at(iDist)),
      seconds: parseNum(at(iSec)),
      notes: at(iNotes),
      workoutNotes: at(iWNotes),
      setType: at(iType) || null,
    });
  }

  return { headers, mapping, rows, issues };
}

export function rowFingerprint(row: CsvRow): string {
  return [
    row.date ?? "",
    row.workoutName ?? "",
    row.exerciseName ?? "",
    row.setOrder ?? "",
    row.weight ?? "",
    row.reps ?? "",
  ].join("|");
}

export function classifySet(label: string | null): "warmup" | "working" | "drop" | "failure" {
  const t = (label ?? "").toLowerCase();
  if (t.includes("warm")) return "warmup";
  if (t.includes("drop")) return "drop";
  if (t.includes("fail")) return "failure";
  return "working";
}
