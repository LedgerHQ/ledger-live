import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type SuiConfig = {
  node: {
    url: string;
    credentials?: string;
  };
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const coinConfig = buildConConfig<SuiCoinConfig>();

export default coinConfig;
