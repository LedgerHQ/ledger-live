import React from "react";
import { WalletSyncContext } from "@features/platform-ledger-sync";
import { useWatchWalletSync } from "../hooks/useWatchWalletSync";

export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  const walletSyncState = useWatchWalletSync();
  return (
    <WalletSyncContext.Provider value={walletSyncState}>{children}</WalletSyncContext.Provider>
  );
}
