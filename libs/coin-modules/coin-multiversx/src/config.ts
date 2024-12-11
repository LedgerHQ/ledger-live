import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type MultiversXCoinConfig = () => CurrencyConfig & {
  config_currency_multiversx: {
    type: "object";
    default: {
      status: {
        type: "active";
      };
    };
  };
};

let coinConfig: MultiversXCoinConfig | undefined;

export const setCoinConfig = (config: MultiversXCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<MultiversXCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("MultiversX module config not set");
  }

  return coinConfig();
};
