import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";

export type IconConfig = {
  infra: {
    ICON_INDEXER_ENDPOINT: string;
    ICON_NODE_ENDPOINT: string;
    ICON_DEBUG_ENDPOINT: string;
  };
};

export type IconCoinConfig = CurrencyConfig & IconConfig;

let coinConfig: CoinConfig<IconCoinConfig> | undefined;

export const setCoinConfig = (config: CoinConfig<IconCoinConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (currencyId: string): IconCoinConfig => {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig(currencyId);
};
