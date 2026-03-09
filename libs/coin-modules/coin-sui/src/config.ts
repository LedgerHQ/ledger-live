import { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

export type SuiConfig = {
  node: {
    url: string;
  };
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const coinConfig = buildCoinConfig<SuiCoinConfig>();

export default coinConfig;
