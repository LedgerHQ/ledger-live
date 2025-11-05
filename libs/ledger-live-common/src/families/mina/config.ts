import { CurrencyLiveConfigDefinition } from "../../config";

const minaConfig: CurrencyLiveConfigDefinition = {
  config_currency_mina: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
        API_MINA_GRAPHQL_NODE: "https://mina.coin.ledger.com/node/graphql",
        API_BLOCKBERRY_BASE_URL: "https://api.blockberry.one",
      },
    },
  },
};

export { minaConfig };
