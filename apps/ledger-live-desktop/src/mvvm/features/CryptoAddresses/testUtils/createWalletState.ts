import type { WalletState } from "~/renderer/reducers/wallet";

export function createWalletState(accountNames: Map<string, string>): { wallet: WalletState } {
  return {
    wallet: {
      accountNames,
      starredAccountIds: new Set(),
      walletSync: { walletSyncState: { data: null, version: 0 } },
      nonImportedAccountInfos: [],
      recentAddresses: {},
    },
  };
}
