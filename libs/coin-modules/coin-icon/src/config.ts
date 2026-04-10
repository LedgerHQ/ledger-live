import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";

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

declare global {
  var __ledgerCoinConfig_icon: CoinConfig<IconCoinConfig> | undefined;
}

export const setCoinConfig = (config: CoinConfig<IconCoinConfig>): void => {
  globalThis.__ledgerCoinConfig_icon = config;
};

export const getCoinConfig = (): IconCoinConfig => {
  if (!globalThis.__ledgerCoinConfig_icon) {
    throw new MissingCoinConfig();
  }

  return globalThis.__ledgerCoinConfig_icon();
};
