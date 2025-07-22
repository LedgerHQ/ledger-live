import { CurrencyLiveConfigDefinition } from "../../config";

const minaConfig: CurrencyLiveConfigDefinition = {
  config_currency_mina: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://hel1-mina-rosetta-api-mainnet.zondax.ch",
        API_MINA_GRAPHQL_NODE: "https://hel1-mina-rosetta-api-mainnet.zondax.ch/graphql",
      },
    },
  },
};

export { minaConfig };
