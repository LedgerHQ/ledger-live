import { CurrencyLiveConfigDefinition } from "../../config";

const minaConfig: CurrencyLiveConfigDefinition = {
  config_currency_mina: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
      },
    },
  },
};

export { minaConfig };
