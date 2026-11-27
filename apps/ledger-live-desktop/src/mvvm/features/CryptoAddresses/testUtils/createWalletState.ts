import { parseAnyAccountId } from "@domain/entity-account";
import type { WalletState } from "~/renderer/reducers/wallet";

export function createWalletState(accountNames: Map<string, string>): { wallet: WalletState } {
  return {
    wallet: {
      accountNames: new Map([...accountNames].map(([id, name]) => [parseAnyAccountId(id), name])),
      walletSync: { walletSyncState: { data: null, version: 0 } },
      nonImportedAccountInfos: [],
      recentAddresses: {},
    },
  };
}
