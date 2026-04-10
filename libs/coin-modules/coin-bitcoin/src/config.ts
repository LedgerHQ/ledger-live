import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { FamilyConfig, findFamilyConfigById } from "./familyConfig";

export type BitcoinConfigInfo = CurrencyConfig;

type BitcoinCoinConfig = {
  info: BitcoinConfigInfo;
};

export type CoinConfig = (currencyId: string) => BitcoinCoinConfig;

declare global {
  var __ledgerCoinConfig_bitcoin: CoinConfig | undefined;
}

export const setCoinConfig = (config: CoinConfig): void => {
  globalThis.__ledgerCoinConfig_bitcoin = config;
};

export const getCoinConfig = (
  currencyId: string,
): BitcoinCoinConfig & { family: FamilyConfig | undefined } => {
  if (!globalThis.__ledgerCoinConfig_bitcoin) {
    throw new Error("Bitcoin module config not set");
  }

  const coin = globalThis.__ledgerCoinConfig_bitcoin(currencyId);
  const family = findFamilyConfigById(currencyId);

  return {
    ...coin,
    family,
  };
};
