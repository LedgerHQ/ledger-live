import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type StellarConfig = {
  explorer: {
    url: string;
    fetchLimit?: number;
  };
  useStaticFees?: boolean;
  enableNetworkLogs?: boolean;
};

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

const coinConfig = buildCoinConfig<StellarCoinConfig>();

export default coinConfig;
