import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { FamilyConfig, findFamilyConfigById } from "./familyConfig";

export type BitcoinConfigInfo = CurrencyConfig;

type BitcoinCoinConfig = {
  info: BitcoinConfigInfo;
};

export type CoinConfig = (currencyId: string) => BitcoinCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (
  currencyId: string,
): BitcoinCoinConfig & { family: FamilyConfig | undefined } => {
  if (!coinConfig) {
    throw new Error("Bitcoin module config not set");
  }

  const coin = coinConfig(currencyId);
  const family = findFamilyConfigById(currencyId);

  return {
    ...coin,
    family,
  };
};
