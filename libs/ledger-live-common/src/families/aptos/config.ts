import { CurrencyLiveConfigDefinition } from "../../config";

const aptosConfig: CurrencyLiveConfigDefinition = {
  config_currency_aptos: {
    type: "object",
    default: {
      status: { type: "active" },
    },
  },
};

export { aptosConfig };
