import { CurrencyLiveConfigDefinition } from "../../config";

const minaConfig: CurrencyLiveConfigDefinition = {
  config_currency_mina: {
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
        API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
        API_MINA_GRAPHQL_NODE: "https://mina.coin.ledger.com/node/graphql",
        API_VALIDATORS_BASE_URL: "https://mina.coin.ledger.com/node/validators",
      },
    },
  },
};

export { minaConfig };
