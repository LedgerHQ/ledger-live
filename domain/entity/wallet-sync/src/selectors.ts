import type { WalletSyncState } from "./schema";

export const walletSyncStateSelector = (
  state: WalletSyncState,
): WalletSyncState["walletSyncState"] => state.walletSyncState;
