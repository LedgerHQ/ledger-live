import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { configureStore } from "@reduxjs/toolkit";
import { cryptoAssetsApi, createRtkCryptoAssetsStore } from "./state-manager";
import { setCryptoAssetsStore as setGlobalCryptoAssetsStore } from "../state";

/**
 * Sets up a real CAL client store that connects to the API.
 * This creates a Redux store with RTK Query middleware and connects it to the CAL API.
 * This function should be used in integration tests and applications that need real token data.
 *
 * The store is automatically set as the global store in cryptoassets, so all modules can access it
 * via getCryptoAssetsStore() from @ledgerhq/cryptoassets/state.
 */
export function setupCalClientStore(): CryptoAssetsStore {
  const store = configureStore({
    reducer: {
      [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(cryptoAssetsApi.middleware),
  });

  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  // Set as global store so all modules can access it
  setGlobalCryptoAssetsStore(cryptoAssetsStore);

  return cryptoAssetsStore;
}

/**
 * Creates a mock CryptoAssetsStore for unit tests.
 * You can provide custom implementations for each method.
 */
export function createMockCryptoAssetsStore(
  overrides?: Partial<CryptoAssetsStore>,
): CryptoAssetsStore {
  const defaultStore: CryptoAssetsStore = {
    findTokenById: async (_id: string): Promise<TokenCurrency | undefined> => {
      return undefined;
    },
    findTokenByAddressInCurrency: async (
      _address: string,
      _currencyId: string,
    ): Promise<TokenCurrency | undefined> => {
      return undefined;
    },
    getTokensSyncHash: async (_currencyId: string): Promise<string> => {
      return "";
    },
    ...overrides,
  };

  return defaultStore;
}

/**
 * Sets up a mock CryptoAssetsStore for unit tests.
 *
 * The store is automatically set as the global store in cryptoassets, so all modules can access it
 * via getCryptoAssetsStore() from @ledgerhq/cryptoassets/state.
 */
export function setupMockCryptoAssetsStore(
  mockStore?: Partial<CryptoAssetsStore>,
): CryptoAssetsStore {
  const store = createMockCryptoAssetsStore(mockStore);
  // Set as global store so all modules can access it
  setGlobalCryptoAssetsStore(store);
  return store;
}
