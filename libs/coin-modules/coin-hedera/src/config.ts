import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import "@ledgerhq/types-cryptoassets";

export type HederaCoinConfig = () => CurrencyConfig & {
  config_currency_hedera: {
    type: "object";
    default: {
      status: {
        type: "active";
      };
    };
  };
};

let coinConfig: HederaCoinConfig | undefined;

export const setCoinConfig = (config: HederaCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<HederaCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Elrond module config not set");
  }

  return coinConfig();
};
