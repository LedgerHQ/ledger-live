import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export interface HederaConfig {
  explorer: {
    url: string;
  };
}

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
