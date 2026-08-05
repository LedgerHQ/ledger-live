import type { WSState, WalletSyncState } from "./schema";

type WalletSyncStateRoot = { walletSync: WalletSyncState };

export const walletSyncStateSelector = (state: WalletSyncStateRoot): WSState =>
  state.walletSync.walletSyncState;
