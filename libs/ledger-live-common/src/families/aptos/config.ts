import { CurrencyLiveConfigDefinition } from "../../config";

const aptosConfig: CurrencyLiveConfigDefinition = {
  config_currency_aptos: {
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
        APTOS_API_ENDPOINT: "https://apt.coin.ledger.com/node",
        APTOS_INDEXER_ENDPOINT: "https://apt.coin.ledger.com/indexer",
      },
    },
  },
  config_currency_aptos_testnet: {
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
        APTOS_API_ENDPOINT: "https://api.testnet.aptoslabs.com/v1",
        APTOS_INDEXER_ENDPOINT: "https://api.testnet.aptoslabs.com/v1/graphql",
      },
    },
  },
};

export { aptosConfig };
