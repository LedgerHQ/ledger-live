import { CurrencyLiveConfigDefinition } from "../../config";

const vechainConfig: CurrencyLiveConfigDefinition = {
  config_currency_vechain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: {
        API_VECHAIN_THOREST: "https://vechain.coin.ledger.com",
      },
    },
  },
};

export { vechainConfig };
