import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

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

declare global {
  var __ledgerCoinConfig_multiversx: MultiversXCoinConfig | undefined;
}

export const setCoinConfig = (config: MultiversXCoinConfig): void => {
  globalThis.__ledgerCoinConfig_multiversx = config;
};

export const getCoinConfig = (): ReturnType<MultiversXCoinConfig> => {
  if (!globalThis.__ledgerCoinConfig_multiversx?.()) {
    throw new Error("MultiversX module config not set");
  }

  return globalThis.__ledgerCoinConfig_multiversx();
};
