import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeLRUCache } from "../cache";
import { getCurrencyBridge } from "./";
export type BridgeCacheSystem = {
  hydrateCurrency: (
    currency: CryptoCurrency
  ) => Promise<unknown | null | undefined>;
  prepareCurrency: (
    currency: CryptoCurrency
  ) => Promise<unknown | null | undefined>;
};
const defaultCacheStrategy = {
  preloadMaxAge: 5 * 60 * 1000,
};
export function makeBridgeCacheSystem({
  saveData,
  getData,
}: {
  saveData: (currency: CryptoCurrency, data: unknown) => Promise<void>;
  getData: (currency: CryptoCurrency) => Promise<unknown | null | undefined>;
}): BridgeCacheSystem {
  const hydrateCurrency = async (currency: CryptoCurrency) => {
    const value = await getData(currency);
    const bridge = getCurrencyBridge(currency);
    bridge.hydrate(value, currency);
    return value;
  };

  const lruCaches = {};

  const prepareCurrency = async (currency: CryptoCurrency) => {
    const bridge = getCurrencyBridge(currency);
    const { preloadMaxAge } = {
      ...defaultCacheStrategy,
      ...(bridge.getPreloadStrategy && bridge.getPreloadStrategy(currency)),
    };
    let cache = lruCaches[currency.id];

    if (!cache) {
      cache = makeLRUCache(
        async () => {
          const preloaded = await bridge.preload(currency);

          if (preloaded) {
            bridge.hydrate(preloaded, currency);
            await saveData(currency, preloaded);
          }

          return preloaded;
        },
        () => "",
        {
          ttl: preloadMaxAge,
        }
      );
      lruCaches[currency.id] = cache;
    }

    return cache();
  };

  return {
    hydrateCurrency,
    prepareCurrency,
  };
}
