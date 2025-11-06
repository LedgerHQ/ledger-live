import { cryptoAssetsApi, createRtkCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client";
import {
  useTokenById,
  useTokenByAddressInCurrency,
  useCurrencyById,
} from "@ledgerhq/cryptoassets/hooks";
import { setCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { StoreType } from "../context/store";

export const cryptoAssetsHooks = {
  useTokenById,
  useTokenByAddressInCurrency,
  useCurrencyById,
};

export function setupCryptoAssetsStore(store: StoreType) {
  const cryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, async <T>(action: T) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return store.dispatch(action as Parameters<typeof store.dispatch>[0]) as unknown;
  });

  setCryptoAssetsStore(cryptoAssetsStore);
  setCryptoAssetsStoreForCoinFramework(cryptoAssetsStore);
}
