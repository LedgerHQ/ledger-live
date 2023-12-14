import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import defaultConfig from "./defaultConfig";
import { CurrencyConfigCommon } from "./types";

const getCurrencyConfiguration = makeLRUCache(
  async (currency: CryptoCurrency): Promise<CurrencyConfigCommon | undefined> => {
    const currencyConfigUrl = getEnv("CURRENCY_CONFIG_BASE_URL");
    try {
      const remoteConfig = await network({
        method: "GET",
        url: `${currencyConfigUrl}/config/${currency.family}/${currency.id}.json`,
      });
      if (remoteConfig.data != null) {
        return remoteConfig.data;
      } else {
        throw new Error(`No currency configuration available remotely for ${currency.id}`);
      }
    } catch (e) {
      if (
        defaultConfig &&
        defaultConfig.config &&
        defaultConfig.config[currency.family] &&
        defaultConfig.config[currency.family][currency.id]
      ) {
        console.warn(
          `No currency configuration available for ${currency.id}, using local configuration as backup`,
        );
        return Promise.resolve(defaultConfig.config[currency.family][currency.id]);
      } else {
        throw new Error(`No currency configuration available for ${currency.id}`);
      }
    }
  },
  currency => currency.id,
  { ttl: 1 * 60 * 60 * 1000 }, // 1 hour
);

export { getCurrencyConfiguration };
