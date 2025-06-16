import { type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import buildCoinConfig from "@ledgerhq/coin-framework/config";

export type SuiConfig = {
  node: {
    url: string;
  };
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const coinConfig = buildCoinConfig<SuiCoinConfig>();

export default coinConfig;
