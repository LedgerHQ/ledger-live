import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";

export const casperConfig: ConfigSchema = {
  config_casper_generic_bridge: {
    type: "boolean",
    default: true,
  },
  config_currency_casper: {
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
        API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
        API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
      },
    },
  },
};
