// ~/renderer/screens/dashboard/concordium/useConcordiumAccountScan.ts
import { useCallback, useEffect, useState, useRef } from "react";

const STORAGE_KEY = "concordium-saved-accounts";

// Configure based on network
export const CONCORDIUM_GRPC_CONFIG = {
  Mainnet: {
    address: "grpc.mainnet.concordium.com",
    port: "20000",
    useSsl: false,
  },
  Testnet: {
    // address: "grpc.testnet.concordium.com",
    address: "node.testnet.concordium.com",
    port: "20000",
    useSsl: false,
  },
} as const;

export type SavedConcordiumAccount = {
  address: string;
  createdAt: number;
  txHash?: string;
};

export type ConcordiumAccountInfo = {
  accountAddress: string;
  accountNonce: { value: string };
  accountAmount: { microCcdAmount: string };
  accountIndex: string;
  accountCredentials?: any;
};

export type ConcordiumAccountWithInfo = SavedConcordiumAccount & {
  info?: ConcordiumAccountInfo | null;
};

// Declare the window.grpc type
// declare global {
//   interface Window {
//     api: {
//       grpc: {
//       setLocation: (address: string, port: string, useSsl: boolean) => void;
//       getAccountInfo: (address: string, blockHash?: string) => Promise<string>;
//       getConsensusStatus: () => Promise<string>;
//       healthCheck: () => Promise<string>;
//       getTransactionStatus: (txHash: string) => Promise<string>;
//       waitForTransactionFinalization: (txHash: string, timeoutMs?: number) => Promise<string>;
//     };
//   }
//   }
// }

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

export function removeSavedConcordiumAccount(address: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  const existing = loadSavedConcordiumAccounts();
  const updated = existing.filter(acc => acc.address !== address);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ---- hook -----------------------------------------------------------------
export function useConcordiumAccountsScan(network: "Mainnet" | "Testnet" = "Mainnet") {
  const [accounts, setAccounts] = useState<ConcordiumAccountWithInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const isInitializedRef = useRef(false);

  const refresh = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Initialize gRPC client location (only needs to be done once per network change)
        const config = CONCORDIUM_GRPC_CONFIG[network];
        console.log({ windowapi: window.api });
        window.api.grpc.setLocation(config.address, config.port, config.useSsl);
        console.log(`[Concordium] gRPC client configured for ${network}:`, config);

        // Verify connection by getting consensus status
        const consensusJson = await window.api.grpc.getConsensusStatus();
        const consensus = JSON.parse(consensusJson);
        console.log("[Concordium] Connected - Best block height:", consensus.bestBlockHeight);

        // Load saved accounts
        const saved = loadSavedConcordiumAccounts();
        console.log(`[Concordium] Found ${saved.length} saved accounts`);

        const results: ConcordiumAccountWithInfo[] = [];

        // Fetch info for each account
        for (const acc of saved) {
          if (cancelled) break;

          try {
            console.log(`[Concordium] Fetching account info for ${acc.address}...`);
            const accountInfoJson = await window.api.grpc.getAccountInfo(acc.address);
            const accountInfo = JSON.parse(accountInfoJson) as ConcordiumAccountInfo;

            console.log(`[Concordium] Account ${acc.address}:`, {
              balance: accountInfo.accountAmount?.microCcdAmount,
              nonce: accountInfo.accountNonce?.value,
              index: accountInfo.accountIndex,
            });

            results.push({
              ...acc,
              info: accountInfo,
            });
          } catch (e) {
            console.warn(`[Concordium] Failed to fetch account info for ${acc.address}:`, e);
            results.push({
              ...acc,
              info: null,
            });
          }
        }

        if (!cancelled) {
          setAccounts(results);
        }
      } catch (e) {
        console.error("[Concordium] Error in account scan:", e);
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
  }, [version, network]);

  return {
    accounts,
    isLoading,
    error,
    refresh,
  };
}

// ---- Helper to format microCCD to CCD ------------------------------------
export function formatMicroCcd(microCcd: string | number | bigint): string {
  const value = BigInt(microCcd);
  const ccd = Number(value) / 1_000_000;
  return ccd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
