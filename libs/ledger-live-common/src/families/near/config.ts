import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";

const nearConfig: ConfigSchema = {
  config_near_generic_bridge: {
    type: "boolean",
    default: false,
  },
  config_currency_near: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
        API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
        API_NEARBLOCKS_INDEXER: "https://near-indexer.coin.ledger.com",
      },
    },
  },
};

export { nearConfig };
