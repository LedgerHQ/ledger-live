import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

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

declare global {
  var __ledgerCoinConfig_stacks: StacksCoinConfig | undefined;
}

export const setCoinConfig = (config: StacksCoinConfig): void => {
  globalThis.__ledgerCoinConfig_stacks = config;
};

export const getCoinConfig = (): ReturnType<StacksCoinConfig> => {
  if (!globalThis.__ledgerCoinConfig_stacks?.()) {
    throw new Error("Stacks module config not set");
  }

  return globalThis.__ledgerCoinConfig_stacks();
};
