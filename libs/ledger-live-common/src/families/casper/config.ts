import { CurrencyLiveConfigDefinition } from "../../config";

export const casperConfig: CurrencyLiveConfigDefinition = {
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
