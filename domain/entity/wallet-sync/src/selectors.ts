import type { WalletSyncState, WSState } from "./schema";

/** The apps mount the slice in their `wallet` reducer. */
export type WalletSyncStateRoot = {
  wallet: { walletSync: WalletSyncState };
};

export function selectWalletSyncState(state: WalletSyncStateRoot): WSState {
  return state.wallet.walletSync.walletSyncState;
}
