import { CurrencyLiveConfigDefinition } from "../../config";

const vechainConfig: CurrencyLiveConfigDefinition = {
  config_currency_vechain: {
    type: "object",
    default: {
      status: { type: "active" },
    },
  },
};

export { vechainConfig };