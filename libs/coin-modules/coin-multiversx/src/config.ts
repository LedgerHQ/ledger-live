import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type MultiversxCoinConfig = () => CurrencyConfig & {
  config_currency_multiversx: {
    type: "object";
    default: {
      status: {
        type: "active";
      };
    };
  };
};

let coinConfig: MultiversxCoinConfig | undefined;

export const setCoinConfig = (config: MultiversxCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<MultiversxCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("MultiversX module config not set");
  }

  return coinConfig();
};
