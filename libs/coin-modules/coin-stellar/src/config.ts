import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type StellarConfig = {
  explorer: {
    url: string;
    fetchLmit: number;
  };
  useStaticFees: boolean;
  enableNetworkLogs: boolean;
};

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

const coinConfig = buildCoinConfig<StellarCoinConfig>();

export default coinConfig;
