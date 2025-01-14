import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type AptosConfig = {
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
};

export type AptosCoinConfig = CurrencyConfig & AptosConfig;

const coinConfig = buildConConfig<AptosCoinConfig>();

export default coinConfig;
