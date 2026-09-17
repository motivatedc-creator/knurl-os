import { createContext, useContext } from "react";

export const VaultReadyContext = createContext(false);

export function useVaultReady(): boolean {
  return useContext(VaultReadyContext);
}
