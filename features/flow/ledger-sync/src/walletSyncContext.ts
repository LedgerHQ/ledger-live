import { createContext } from "react";
import type { WalletSyncUserState } from "@features/platform-wallet-sync";

/**
 * The watch loop state of the app. Each app provides it from its `useWatchWalletSync`; without a
 * provider, nothing is pending and refresh is a no-op.
 *
 * @example
 * ```tsx
 * <WalletSyncContext.Provider value={useWatchWalletSync()}>{children}</WalletSyncContext.Provider>
 * ```
 */
export const WalletSyncContext = createContext<WalletSyncUserState>({
  visualPending: false,
  walletSyncError: null,
  onUserRefresh() {},
});
