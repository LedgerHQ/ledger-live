import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CasperCoinConfig = () => CurrencyConfig & {
  infra: {
    API_CASPER_NODE_ENDPOINT: string;
    API_CASPER_INDEXER: string;
  };
};

declare global {
  var __ledgerCoinConfig_casper: CasperCoinConfig | undefined;
}

export const setCoinConfig = (config: CasperCoinConfig): void => {
  globalThis.__ledgerCoinConfig_casper = config;
};

export const getCoinConfig = (): ReturnType<CasperCoinConfig> => {
  if (!globalThis.__ledgerCoinConfig_casper?.()) {
    throw new Error("Casper module config not set");
  }

  return globalThis.__ledgerCoinConfig_casper();
};
