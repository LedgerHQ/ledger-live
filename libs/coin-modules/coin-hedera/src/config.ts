import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import buildCoinConfig, { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type HederaConfig = Record<string, ConfigInfo>;
export const hederaConfig: HederaConfig = {
  config_currency_hedera: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
