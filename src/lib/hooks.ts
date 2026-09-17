import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useVaultReady } from "./storage/ready";
import { vault, recentExerciseIds } from "./storage/repo";

export function useTick(enabled: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [enabled, ms]);
  return now;
}

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Dexie live queries must not await non-IDB promises (that drops observation).
 * Gate on vault-ready instead of awaiting openVault inside the querier.
 */
export function useVaultQuery<T>(querier: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const ready = useVaultReady();
  return useLiveQuery(() => (ready ? querier() : undefined), [ready, ...deps]);
}

export function useExercises() {
  return useVaultQuery(() => vault.listExercises()) ?? [];
}

export function useTemplates() {
  return useVaultQuery(() => vault.listTemplates()) ?? [];
}

export function useActiveWorkout() {
  return useVaultQuery(() => vault.getActiveWorkout());
}

export function useWorkouts() {
  return useVaultQuery(() => vault.listWorkouts()) ?? [];
}

export function useEquipment() {
  return useVaultQuery(() => vault.getEquipment());
}

export function usePrefsRow() {
  return useVaultQuery(() => vault.getPrefs());
}

export function useRecentExerciseIds() {
  return useVaultQuery(() => recentExerciseIds()) ?? [];
}
