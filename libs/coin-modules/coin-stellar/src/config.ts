import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type StellarConfig = {
  node: {
    url: string;
  };
};

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

let coinConfig: CoinConfig<StellarCoinConfig> | undefined;

export const setCoinConfig = (config: CoinConfig<StellarCoinConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): StellarCoinConfig => {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
};
