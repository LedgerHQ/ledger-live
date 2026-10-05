import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";

export const polkadotConfig: Record<string, ConfigInfo> = {
  config_currency_polkadot: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "inactive" },
        ],
      },
      name: "Polkadot",
      unit: { name: "DOT", code: "DOT", magnitude: 10 },
      sidecar: {
        url: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1/rc",
        credentials: getEnv("API_POLKADOT_SIDECAR_CREDENTIALS"),
      },
      indexer: {
        url: "https://polkadot.coin.ledger.com",
      },
      node: {
        url: "https://polkadot-fullnodes.api.live.ledger.com",
      },
    },
  },
  config_currency_assethub_polkadot: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Polkadot",
      unit: { name: "DOT", code: "DOT", magnitude: 10 },
      sidecar: {
        url: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1",
      },
      node: {
        url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com",
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub",
      },
      hasBeenMigrated: true,
    },
  },
  config_currency_westend: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "inactive" },
        ],
      },
      name: "Westend",
      unit: { name: "WND", code: "WND", magnitude: 12 },
      sidecar: {
        url: "https://polkadot-westend-rest-api.coin.ledger.com/v1/rc",
      },
      node: {
        url: "https://polkadot-westend-fullnodes.api.live.ledger.com",
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_westend",
      },
    },
  },
  config_currency_assethub_westend: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Assethub Westend",
      unit: { name: "WND", code: "WND", magnitude: 12 },
      sidecar: {
        url: "https://polkadot-westend-rest-api.coin.ledger.com/v1",
      },
      node: {
        url: "https://polkadot-westend-asset-hub-fullnodes.api.live.ledger.com",
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub_westend",
      },
    },
  },
};
