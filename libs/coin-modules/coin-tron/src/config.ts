import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type TronConfig = {
  explorer: {
    url: string;
  };
};

export type TronCoinConfig = CurrencyConfig & TronConfig;

let coinConfig: CoinConfig<TronCoinConfig> | undefined;

export const setCoinConfig = (config: CoinConfig<TronCoinConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): TronCoinConfig => {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
};
