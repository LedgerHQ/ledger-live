import { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import buildCoinConfig from "@ledgerhq/coin-module-framework/config";

export type SuiConfig = {
  node: {
    url: string;
  };
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const { setCoinConfig, getCoinConfig } = buildCoinConfig<SuiCoinConfig>();
export default { setCoinConfig, getCoinConfig };
