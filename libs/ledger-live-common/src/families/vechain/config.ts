import { getEnv } from "@shared/env";
import { CurrencyLiveConfigDefinition } from "../../config";

const vechainConfig: CurrencyLiveConfigDefinition = {
  config_currency_vechain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Vechain",
      unit: { name: "VET", code: "VET", magnitude: 18 },
      node: {
        url: getEnv("API_VECHAIN_THOREST"),
      },
      chainTag: 74,
    },
  },
};

export { vechainConfig };
