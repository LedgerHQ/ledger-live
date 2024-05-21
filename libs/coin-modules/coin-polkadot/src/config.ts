import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";

type PolkadotConfig = {
  sidecar: {
    url: string;
  };
  metadataShortener: {
    url: string;
  };
};

export type PolkadotCoinConfig = CurrencyConfig & PolkadotConfig;

let coinConfig: CoinConfig<PolkadotCoinConfig> | undefined;

export const setCoinConfig = (config: CoinConfig<PolkadotCoinConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): PolkadotCoinConfig => {
  if (!coinConfig) {
    throw new Error("Polkadot module config not set");
  }

  return coinConfig();
};
