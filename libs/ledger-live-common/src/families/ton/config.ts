import { CurrencyLiveConfigDefinition } from "../../config";

const tonConfig: CurrencyLiveConfigDefinition = {
  config_currency_ton: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_TON_KEY: "1fe6f81ec629684a4242a578b179991990830616ccdd854393ca6379d5d3199a",
        API_TON_ENDPOINT: "https://toncenter.com/api/v3",
      },
    },
  },
};

export { tonConfig };
