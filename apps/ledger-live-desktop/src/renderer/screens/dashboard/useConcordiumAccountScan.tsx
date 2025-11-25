// ~/renderer/screens/dashboard/useConcordiumAccountScan.ts
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "concordium-saved-accounts";

export type SavedConcordiumAccount = {
  address: string;
  createdAt: number; // timestamp (ms)
  txHash?: string;
};

// Minimal shape of what main returns for getAccountInfo.
// If you have a stricter type from the Node side, you can mirror it here.
export type ConcordiumAccountInfo = any;

export type ConcordiumAccountWithInfo = SavedConcordiumAccount & {
  info?: ConcordiumAccountInfo | null; // null = not found / error
};

// ---- localStorage helpers -------------------------------------------------

export function loadSavedConcordiumAccounts(): SavedConcordiumAccount[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(item => {
        if (!item || typeof item !== "object") return null;

        const address = (item as any).address;
        const createdAt = (item as any).createdAt;
        const txHash = (item as any).txHash;

        if (typeof address !== "string" || typeof createdAt !== "number") {
          return null;
        }

        return { address, createdAt, txHash } as SavedConcordiumAccount;
      })
      .filter((x): x is SavedConcordiumAccount => x !== null);
  } catch (e) {
    console.error("[Concordium] Failed to load saved accounts:", e);
    return [];
  }
}

export function saveConcordiumAccount(account: { address: string; txHash?: string }) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  const existing = loadSavedConcordiumAccounts();

  const newEntry: SavedConcordiumAccount = {
    address: account.address,
    createdAt: Date.now(),
    txHash: account.txHash,
  };

  const updated = [...existing, newEntry];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ---- hook -----------------------------------------------------------------

export function useConcordiumAccountsScan() {
  const [accounts, setAccounts] = useState<ConcordiumAccountWithInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0); // bump to trigger rescan

  const refresh = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const saved = loadSavedConcordiumAccounts();
        const results: ConcordiumAccountWithInfo[] = [];

        for (const acc of saved) {
          try {
            if (!cancelled) {
              results.push({
                ...acc,
                info: null,
              });
            }
          } catch (e) {
            if (!cancelled) {
              console.warn(`[Concordium] Failed to fetch account info for ${acc.address}:`, e);
              results.push({
                ...acc,
                info: null,
              });
            }
          }
        }

        if (!cancelled) {
          setAccounts(results);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return {
    accounts,
    isLoading,
    error,
    refresh,
  };
}
