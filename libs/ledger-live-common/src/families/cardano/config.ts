import { CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const cardanoConfig: CurrencyLiveConfigDefinition = {
  config_currency_cardano: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      maxFeesWarning: 5e6,
      maxFeesError: 10e6,
    } as CardanoCoinConfig,
  },
};
