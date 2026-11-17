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
  /** Legacy account sync tuning. Absent means every default below applies. */
  sync?: {
    /**
     * Read the nearblocks history and list the staking pools only when the account state on the
     * node changed. `false` reads both on every sync, as the legacy sync did before.
     * @default true
     */
    stateDriven?: boolean;
  };
};

export const DEFAULT_SYNC_STATE_DRIVEN = true;

export const isStateDrivenSync = (config: NearConfig): boolean =>
  config.sync?.stateDriven ?? DEFAULT_SYNC_STATE_DRIVEN;

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

export const nearDefaults = {
  near: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "NEAR",
    unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
    infra: {
      API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
      API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
      API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
      API_NEARBLOCKS_INDEXER: "https://near-indexer.coin.ledger.com",
    },
  },
} satisfies Record<string, NearConfig>;
