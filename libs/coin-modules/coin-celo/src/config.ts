import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const celoConfig: Record<string, ConfigInfo> = {
  config_currency_celo: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", type: "active" },
          { id: "staking_txs", type: "active" },
        ],
      },
      node: {
        type: "external",
        uri: "https://celo.coin.ledger.com/archive",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/42220",
      },
    },
  },
};
