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
      name: "Aptos",
      unit: { name: "APT", code: "APT", magnitude: 8 },
    },
  },
};

export { aptosConfig };
