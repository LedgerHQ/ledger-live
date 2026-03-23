import type { WalletState } from "@ledgerhq/live-wallet/store";

export function createWalletState(accountNames: Map<string, string>): { wallet: WalletState } {
  return {
    wallet: {
      accountNames,
      starredAccountIds: new Set(),
      nonImportedAccountInfos: [],
      walletSyncState: { data: null, version: 0 },
      recentAddresses: {},
    },
  };
}
