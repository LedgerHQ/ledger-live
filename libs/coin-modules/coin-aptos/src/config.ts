import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type AptosCoinConfig = () => CurrencyConfig;

let coinConfig: AptosCoinConfig | undefined;

export const setCoinConfig = (config: AptosCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<AptosCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Aptos module config not set");
  }

  return coinConfig();
};
