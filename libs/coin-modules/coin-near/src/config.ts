import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type NearCoinConfig = () => CurrencyConfig & {
  infra: {
    // Can be used for sensitive or rate limited requests
    API_NEAR_PRIVATE_NODE: string;
    API_NEAR_PUBLIC_NODE: string;
    API_NEAR_INDEXER: string;
    API_NEARBLOCKS_INDEXER: string;
  };
};

declare global {
  var __ledgerCoinConfig_near: NearCoinConfig | undefined;
}

export const setCoinConfig = (config: NearCoinConfig): void => {
  globalThis.__ledgerCoinConfig_near = config;
};

export const getCoinConfig = (): ReturnType<NearCoinConfig> => {
  if (!globalThis.__ledgerCoinConfig_near?.()) {
    throw new Error("Near module config not set");
  }

  return globalThis.__ledgerCoinConfig_near();
};
