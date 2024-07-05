import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

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

const coinConfig = buildConConfig<PolkadotCoinConfig>();

export default coinConfig;
