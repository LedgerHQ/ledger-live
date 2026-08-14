import { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

/** Resolved coin configuration for Near. */
export type NearConfig = CurrencyConfig & {
  infra: {
    // Can be used for sensitive or rate limited requests
    API_NEAR_PRIVATE_NODE: string;
    API_NEAR_PUBLIC_NODE: string;
    API_NEAR_INDEXER: string;
    API_NEARBLOCKS_INDEXER: string;
  };
};

/**
 * Legacy config accessor kept for the classic bridge path and the getCoinConfig() singleton that the
 * network/logic layers resolve config through. The new Alpaca `api/` path threads a {@link NearContext}.
 */
export type NearCoinConfig = () => NearConfig;

/** The {@link Context} threaded through the coin-near Alpaca api layer (ADR-019). */
export type NearContext = Context<NearConfig>;

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
