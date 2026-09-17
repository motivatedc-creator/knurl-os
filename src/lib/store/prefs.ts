import { create } from "zustand";
import { defaultPrefs } from "@/lib/domain/equipment";
import type { Prefs } from "@/lib/domain/schema";
import { vault } from "@/lib/storage/repo";
import { nowIso } from "@/lib/utils";

type PrefsState = Prefs & {
  hydrated: boolean;
  hydrate: (prefs: Prefs) => void;
  update: (patch: Partial<Prefs>) => Promise<void>;
};

export const usePrefs = create<PrefsState>((set, get) => ({
  ...defaultPrefs(),
  hydrated: false,
  hydrate: (prefs) => {
    set({ ...prefs, hydrated: true });
    applyTheme(prefs.theme);
  },
  update: async (patch) => {
    const next = { ...get(), ...patch, updatedAt: nowIso() };
    set({ ...next, hydrated: true });
    applyTheme(next.theme);
    const { hydrated: _h, hydrate: _hy, update: _u, ...row } = next;
    await vault.savePrefs(row);
  },
}));

export function applyTheme(theme: Prefs["theme"]) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("theme-chalk", theme === "chalk");
}
