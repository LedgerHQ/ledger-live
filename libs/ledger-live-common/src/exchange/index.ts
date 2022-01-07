import { valid, gte } from "semver";
import type { CryptoCurrency, TokenCurrency } from "../types/currencies";
import { findExchangeCurrencyConfig as findProdExchangeCurrencyConfig } from "@ledgerhq/cryptoassets";
import { getEnv } from "../env";
import { findTestExchangeCurrencyConfig } from "./testCurrencyConfig";
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
  qtum: "1.5.0",
  ripple: "2.1.0",
  stellar: "3.3.0",
  stratis: "1.5.0",
  tezos: "2.2.13",
  zcash: "1.5.0",
  zencash: "1.5.0",
};

const findExchangeCurrencyConfig = (
  id: string
):
  | {
      config: string;

      signature: string;
    }
  | null
  | undefined => {
  return getEnv("MOCK_EXCHANGE_TEST_CONFIG")
    ? findTestExchangeCurrencyConfig(id)
    : findProdExchangeCurrencyConfig(id);
};

export type ExchangeCurrencyNameAndSignature = {
  config: Buffer;
  signature: Buffer;
};
export type ExchangeProviderNameAndSignature = {
  nameAndPubkey: Buffer;
  signature: Buffer;
};
export const isExchangeSupportedByApp = (
  appName: string,
  appVersion: string
): boolean => {
  const minVersion = exchangeSupportAppVersions[appName];
  return !!(
    valid(minVersion) &&
    valid(appVersion) &&
    gte(appVersion, minVersion)
  );
};

const getCurrencyExchangeConfig = (
  currency: CryptoCurrency | TokenCurrency
): ExchangeCurrencyNameAndSignature => {
  const res = findExchangeCurrencyConfig(currency.id);

  if (!res) {
    throw new Error(`Exchange, missing configuration for ${currency.id}`);
  }

  return {
    config: Buffer.from(res.config, "hex"),
    signature: Buffer.from(res.signature, "hex"),
  };
};

const isCurrencyExchangeSupported = (
  currency: CryptoCurrency | TokenCurrency
): boolean => {
  return !!findExchangeCurrencyConfig(currency.id);
};

export { getCurrencyExchangeConfig, isCurrencyExchangeSupported };
