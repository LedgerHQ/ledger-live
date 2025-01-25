import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type IconConfig = {
  infra: {
    indexer: string;
    indexer_testnet: string;
    node_endpoint: string;
    node_testnet_endpoint: string;
    debug_endpoint: string;
    debug_testnet_endpoint: string;
  };
};

export type IconCoinConfig = CurrencyConfig & IconConfig;

let coinConfig: CoinConfig<IconCoinConfig> | undefined;

export const setCoinConfig = (config: CoinConfig<IconCoinConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): IconCoinConfig => {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
};
