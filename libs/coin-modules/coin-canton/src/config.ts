import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CantonConfig = {
  nodeUrl?: string;
  nodeId?: string;
  gatewayUrl?: string;
  // TODELETE
  minReserve?: number;
  networkType: "mainnet" | "devnet" | "testnet" | "localnet";
  useGateway?: boolean;
  nativeInstrumentId: string;
  fee?: number;
};

export type CantonCoinConfig = CurrencyConfig & CantonConfig;

/** The {@link Context} threaded through the coin-canton low layers (ADR-019). */
export type CantonContext = Context<CantonCoinConfig>;

export const cantonDefaults = {
  canton_network: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Canton Network",
    unit: { name: "cc", code: "CC", magnitude: 38 },
    nodeUrl: "https://canton-gateway.api.live.ledger.com/v1/node/ledger-live-mainnet",
    nodeId: "ledger-live-mainnet",
    gatewayUrl: "https://canton-gateway.api.live.ledger.com",
    minReserve: 0,
    useGateway: true,
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
    nodeUrl: "https://canton-gateway-devnet.api.live.ledger-test.com/v1/node/ledger-live-devnet",
    nodeId: "ledger-live-devnet",
    gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
    minReserve: 0,
    useGateway: true,
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
    nodeUrl: "https://canton-gateway-testnet.api.live.ledger-test.com/v1/node/ledger-live-testnet",
    nodeId: "ledger-live-testnet",
    gatewayUrl: "https://canton-gateway-testnet.api.live.ledger-test.com",
    minReserve: 0,
    nativeInstrumentId: "Amulet",
    useGateway: true,
    networkType: "testnet",
    fee: 0,
  },
} satisfies Record<string, CantonCoinConfig>;
