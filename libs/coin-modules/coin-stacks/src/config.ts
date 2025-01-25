import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type StacksCoinConfig = () => CurrencyConfig & {
  config_currency_stacks: {
    type: "object";
    default: {
      status: {
        type: "active";
      };
    };
  };
};

let coinConfig: StacksCoinConfig | undefined;

export const setCoinConfig = (config: StacksCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<StacksCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Stacks module config not set");
  }

  return coinConfig();
};
