import { useEffect, useState, type ReactNode } from "react";
import { KnurlMark } from "@/components/brand/mark";
import { openVault } from "./seed";
import { isVaultAvailable } from "./db";
import { VaultReadyContext } from "./ready";

export function VaultProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!isVaultAvailable()) {
      setBooting(false);
      return;
    }
    openVault()
      .then(() => setBooting(false))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not open local storage.");
        setBooting(false);
      });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-mill px-6 text-center text-chalk">
        <KnurlMark size={48} />
        <p className="font-display text-3xl tracking-tight">Can't open storage</p>
        <p className="max-w-sm text-sm text-steel">{error}</p>
      </div>
    );
  }

  const ready = !booting;

  return (
    <VaultReadyContext.Provider value={ready}>
      {ready ? (
        <div data-testid="vault-ready" hidden />
      ) : (
        <div className="sr-only" aria-live="polite">
          Loading…
        </div>
      )}
      {children}
    </VaultReadyContext.Provider>
  );
}
