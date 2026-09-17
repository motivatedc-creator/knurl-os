import { create } from "zustand";

type Draft = { weight: string; reps: string; rpe: string; duration: string };

type SessionState = {
  selectedExerciseId: string | null;
  restStartedAt: string | null;
  restDurationSec: number;
  plateSetId: string | null;
  drafts: Record<string, Draft>;
  selectExercise: (id: string | null) => void;
  startRest: (seconds: number, at?: string) => void;
  skipRest: () => void;
  reconstructRest: (completedAt: string | null, seconds: number) => void;
  openPlates: (setId: string | null) => void;
  setDraft: (setId: string, patch: Partial<Draft>) => void;
  seedDraft: (setId: string, draft: Draft) => void;
  resetSessionUi: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  selectedExerciseId: null,
  restStartedAt: null,
  restDurationSec: 180,
  plateSetId: null,
  drafts: {},
  selectExercise: (id) => set({ selectedExerciseId: id }),
  startRest: (seconds, at) =>
    set({ restStartedAt: at ?? new Date().toISOString(), restDurationSec: seconds }),
  skipRest: () => set({ restStartedAt: null }),
  reconstructRest: (completedAt, seconds) => {
    if (!completedAt) {
      set({ restStartedAt: null, restDurationSec: seconds });
      return;
    }
    const elapsed = (Date.now() - Date.parse(completedAt)) / 1000;
    if (elapsed >= seconds) {
      set({ restStartedAt: null, restDurationSec: seconds });
      return;
    }
    set({ restStartedAt: completedAt, restDurationSec: seconds });
  },
  openPlates: (setId) => set({ plateSetId: setId }),
  setDraft: (setId, patch) =>
    set({ drafts: { ...get().drafts, [setId]: { ...(get().drafts[setId] ?? emptyDraft()), ...patch } } }),
  seedDraft: (setId, draft) => {
    if (get().drafts[setId]) return;
    set({ drafts: { ...get().drafts, [setId]: draft } });
  },
  resetSessionUi: () =>
    set({
      selectedExerciseId: null,
      restStartedAt: null,
      plateSetId: null,
      drafts: {},
    }),
}));

export function emptyDraft(): Draft {
  return { weight: "", reps: "", rpe: "", duration: "" };
}

export function restRemaining(startedAt: string | null, durationSec: number, now = Date.now()): number {
  if (!startedAt) return 0;
  const elapsed = (now - Date.parse(startedAt)) / 1000;
  return Math.max(0, Math.ceil(durationSec - elapsed));
}
