import React from "react";
import { useWatchWalletSync, WalletSyncUserState } from "../hooks/useWatchWalletSync";

export const WalletSyncContext = React.createContext<WalletSyncUserState>({
  visualPending: false,
  walletSyncError: null,
  onUserRefresh: () => {},
});

export const useWalletSyncUserState = () => React.useContext(WalletSyncContext);

export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  const walletSyncState = useWatchWalletSync();
  return (
    <WalletSyncContext.Provider value={walletSyncState}>{children}</WalletSyncContext.Provider>
  );
}
