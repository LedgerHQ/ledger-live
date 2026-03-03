import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { FamilyConfig, findFamilyConfigById } from "./familyConfig";

export type BitcoinConfigInfo = CurrencyConfig;

type BitcoinCoinConfig = {
  info: BitcoinConfigInfo;
};

export type CoinConfig = (currency: CryptoCurrency) => BitcoinCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (
  currency: CryptoCurrency,
): BitcoinCoinConfig & { family: FamilyConfig | undefined } => {
  if (!coinConfig) {
    throw new Error("Bitcoin module config not set");
  }

  const coin = coinConfig(currency);
  const family = findFamilyConfigById(currency.id);

  return {
    ...coin,
    family,
  };
};
