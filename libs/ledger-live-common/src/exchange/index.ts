import { valid, gte } from "semver";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { findTestExchangeCurrencyConfig } from "./testCurrencyConfig";
import { findExchangeCurrencyData } from "./providers/swap";
import { findExchangeCurrencyConfig as findProdExchangeCurrencyConfig } from "@ledgerhq/cryptoassets";
// Minimum version of a currency app which has exchange capabilities, meaning it can be used
// for sell/swap, and do silent signing.
const exchangeSupportAppVersions = {
  bitcoin_cash: "1.5.0",
  bitcoin_gold: "1.5.0",
  bitcoin: "1.5.0",
  dash: "1.5.0",
  digibyte: "1.5.0",
  dogecoin: "1.5.0",
  ethereum: "1.4.0",
  litecoin: "1.5.0",
  polkadot: "24.9430.3",
  qtum: "1.5.0",
  ripple: "2.1.0",
  solana: "1.4.0",
  stellar: "3.3.0",
  stratis: "1.5.0",
  tezos: "2.2.13",
  tron: "0.4.100",
  zcash: "1.5.0",
  zencash: "1.5.0",
};

type ExchangeCurrencyNameAndSignature = {
  config: Buffer;
  signature: Buffer;
};

export const isExchangeSupportedByApp = (appName: string, appVersion: string): boolean => {
  const minVersion = exchangeSupportAppVersions[appName];
  return !!(valid(minVersion) && valid(appVersion) && gte(appVersion, minVersion));
};

export const getCurrencyExchangeConfig = async (
  currency: CryptoCurrency | TokenCurrency,
): Promise<ExchangeCurrencyNameAndSignature> => {
  let res;
  try {
    res = getEnv("MOCK_EXCHANGE_TEST_CONFIG")
      ? await findTestExchangeCurrencyConfig(currency.id)
      : await findExchangeCurrencyData(currency.id);

    if (!res) {
      throw new Error("Missing primary config");
    }
  } catch (error) {
    // Fallback to old production config if the primary fetch fails, should be removed when we have a HA CAL
    res = await findProdExchangeCurrencyConfig(currency.id);

    if (!res) {
      throw new Error(`Exchange, missing configuration for ${currency.id}`);
    }
  }

  return {
    config: Buffer.from(res.config, "hex"),
    signature: Buffer.from(res.signature, "hex"),
  };
};
