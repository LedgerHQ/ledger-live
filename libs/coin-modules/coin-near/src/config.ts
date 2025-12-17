import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type NearCoinConfig = () => CurrencyConfig & {
  infra: {
    // Can be used for sensitive or rate limited requests
    API_NEAR_PRIVATE_NODE: string;
    API_NEAR_PUBLIC_NODE: string;
    API_NEAR_INDEXER: string;
  };
};

let coinConfig: NearCoinConfig | undefined;

export const setCoinConfig = (config: NearCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<NearCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Near module config not set");
  }

  return coinConfig();
};
