import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CantonConfig = {
  gatewayUrl: string;
  /** The gateway node, unless the `CANTON_NODE_ID_OVERRIDE` env is set. */
  nodeId: string;
  networkType: "mainnet" | "devnet" | "testnet" | "localnet";
  nativeInstrumentId: string;
  useGateway: boolean;
  /** Smallest unit of CC kept out of the spendable balance. */
  minReserve: number;
  /** A fixed fee in CC. Without it, the fee follows the tier schedule. */
  fee?: number;
  gateway: {
    /**
     * Transactions per operations request of the sync, the account status and the newest-first
     * `listOperations`. Anything larger is clamped to 1000, the largest page known to pass the gateway.
     */
    maxTxQuery: number;
    dsoPartyCacheTtlMs: number;
    partyCacheTtlMs: number;
    topologyCacheTtlMs: number;
    instrumentsCacheTtlMs: number;
  };
  /** Lifetime of the CAL token map. */
  calTokensCacheTtlMs: number;
};

export type CantonCoinConfig = CurrencyConfig & CantonConfig;

/** The {@link Context} threaded through the coin-canton low layers (ADR-019). */
export type CantonContext = Context<CantonCoinConfig>;

/**
 * Pins `context` to one resolved `config`, whatever currency id a consumer asks for.
 *
 * Use it where one operation must see a single configuration, and before handing a context to a
 * layer that calls `context.config()` without a currency id.
 */
export const pinConfig = (context: CantonContext, config: CantonCoinConfig): CantonContext => ({
  ...context,
  config: () => Promise.resolve(config),
});

const tuning = {
  useGateway: true,
  minReserve: 0,
  gateway: {
    maxTxQuery: 1_000,
    dsoPartyCacheTtlMs: 15 * 60 * 1000,
    partyCacheTtlMs: 60 * 60 * 1000,
    topologyCacheTtlMs: 10 * 60 * 1000,
    instrumentsCacheTtlMs: 15 * 60 * 1000,
  },
  calTokensCacheTtlMs: 30 * 60 * 1000,
};

export const cantonDefaults = {
  canton_network: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Canton Network",
    unit: { name: "cc", code: "CC", magnitude: 38 },
    nodeId: "ledger-live-mainnet",
    gatewayUrl: "https://canton-gateway.api.live.ledger.com",
    ...tuning,
    networkType: "mainnet",
    nativeInstrumentId: "Amulet",
    fee: 0,
  },
  canton_network_devnet: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Canton Network (Devnet)",
    unit: { name: "cc", code: "CC", magnitude: 38 },
    nodeId: "ledger-live-devnet",
    gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
    ...tuning,
    networkType: "devnet",
    nativeInstrumentId: "Amulet",
    fee: 0,
  },
  canton_network_testnet: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Canton Network (Testnet)",
    unit: { name: "cc", code: "CC", magnitude: 38 },
    nodeId: "ledger-live-testnet",
    gatewayUrl: "https://canton-gateway-testnet.api.live.ledger-test.com",
    nativeInstrumentId: "Amulet",
    ...tuning,
    networkType: "testnet",
    fee: 0,
  },
} satisfies Record<string, CantonCoinConfig>;
