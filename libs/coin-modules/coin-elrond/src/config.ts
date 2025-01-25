import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type ElrondCoinConfig = () => CurrencyConfig & {
  config_currency_elrond: {
    type: "object";
    default: {
      status: {
        type: "active";
      };
    };
  };
};

let coinConfig: ElrondCoinConfig | undefined;

export const setCoinConfig = (config: ElrondCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<ElrondCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Elrond module config not set");
  }

  return coinConfig();
};
