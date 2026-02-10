import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";

/*
 * Setup a mock CryptoAssetsStore for tests
 */

const mockStore: CryptoAssetsStore = {
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
};

setCryptoAssetsStore(mockStore);
