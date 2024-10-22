import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import "@ledgerhq/types-cryptoassets";

export type FilecoinConfig  = () => CurrencyConfig & {
  config_currency_filecoin: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};

let coinConfig: FilecoinConfig | undefined;

export const setCoinConfig = (config: FilecoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<FilecoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Filecoin module config not set");
  }

  return coinConfig();
};
