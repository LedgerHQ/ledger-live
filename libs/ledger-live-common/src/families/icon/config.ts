import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const iconConfig: Record<string, ConfigInfo> = {
  config_currency_icon: {
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
        ICON_INDEXER_ENDPOINT: "https://icon.coin.ledger.com/api/v1",
        ICON_NODE_ENDPOINT: "https://icon.coin.ledger.com/api/v3",
        ICON_DEBUG_ENDPOINT: "https://icon.coin.ledger.com/api/v3d",
      },
    },
  },
  config_currency_icon_berlin_testnet: {
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
        ICON_INDEXER_ENDPOINT: "https://tracker.berlin.icon.community/api/v1",
        ICON_NODE_ENDPOINT: "https://berlin.net.solidwallet.io/api/v3",
        ICON_DEBUG_ENDPOINT: "https://berlin.net.solidwallet.io/api/v3d",
      },
    },
  },
};
