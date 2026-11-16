import type { WalletSyncState } from "./schema";
import { walletSyncSlice } from "./slice";

/** The apps mount the slice in their `wallet` reducer. */
export type WalletSyncStateRoot = {
  wallet: { walletSync: WalletSyncState };
};

export const { selectWalletSyncState } = walletSyncSlice.getSelectors(
  (state: WalletSyncStateRoot) => state.wallet.walletSync,
);
