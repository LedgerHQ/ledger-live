import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type PolkadotConfig = {
  node: {
    url: string;
    credentials?: string;
  };
  sidecar: {
    url: string;
    credentials?: string;
  };
  staking?: {
    electionStatusThreshold: number;
  };
  metadataShortener: {
    url: string;
  };
  metadataHash: {
    url: string;
  };
  runtimeUpgraded: boolean;
};

export type PolkadotCoinConfig = CurrencyConfig & PolkadotConfig;

let coinConfig: CoinConfig<PolkadotCoinConfig> | undefined;

export const setCoinConfig = (config: CoinConfig<PolkadotCoinConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): PolkadotCoinConfig => {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
};
