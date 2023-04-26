import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeLRUCache } from "../cache";
import network from "../network";
import { CurrencyConfigCommon } from "./types";

export const fetchCurrencyConfiguration = makeLRUCache(
  async (currency: CryptoCurrency): Promise<CurrencyConfigCommon> => {
    const currencyConfigUrl = getEnv("CURRENCY_CONFIG_BASE_URL");
    const { data } = await network({
      method: "GET",
      url: `${currencyConfigUrl}/config/${currency.family}/${currency.id}.json`,
    });
    return data;
  },
  (currency) => currency.id,
  { ttl: 30 * 60 * 1000 } // 30mn
);
