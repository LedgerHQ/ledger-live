import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type CasperCoinConfig = () => CurrencyConfig & {
  infra: {
    API_CASPER_NODE_ENDPOINT: string;
    API_CASPER_INDEXER: string;
  };
};

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
