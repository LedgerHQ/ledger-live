import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import "@ledgerhq/types-cryptoassets";

export type FileCoinConfig = Record<string, ConfigInfo>;

export const fileCoinConfig: FileCoinConfig = {
  config_currency_filecoin: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};

export type FileCoinCurrencyConfig = CurrencyConfig & FileCoinConfig;
const coinConfig = buildCoinConfig<FileCoinCurrencyConfig>();
export default coinConfig;
