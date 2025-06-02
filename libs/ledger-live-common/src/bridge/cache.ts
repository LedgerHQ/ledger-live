import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { BridgeCacheSystem } from "@ledgerhq/types-live";
import { getCurrencyBridge } from "./";

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
    return null;
  };

  const lruCaches = {};

  const prepareCurrency = async (currency: CryptoCurrency) => {
    return null;
  };

  return {
    hydrateCurrency,
    prepareCurrency,
  };
}
