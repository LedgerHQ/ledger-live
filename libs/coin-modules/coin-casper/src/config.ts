import { CasperCoinConfig } from "./types/config";

let coinConfig: CasperCoinConfig | undefined;

export const setCoinConfig = (config: CasperCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<CasperCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Casper module config not set");
  }

  return coinConfig();
};
