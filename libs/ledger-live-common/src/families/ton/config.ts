import { CurrencyLiveConfigDefinition } from "../../config";

const tonConfig: CurrencyLiveConfigDefinition = {
  config_currency_ton: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_TON_ENDPOINT: "https://ton.coin.ledger.com/api/v3",
      },
    },
  },
};

export { tonConfig };
