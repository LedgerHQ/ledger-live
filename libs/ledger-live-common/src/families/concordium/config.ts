import { CurrencyLiveConfigDefinition } from "../../config";

const concordiumConfig: CurrencyLiveConfigDefinition = {
  config_currency_concordium: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
      },
    },
  },
};

export { concordiumConfig };
