import { aptosCoinConfig } from "@ledgerhq/coin-aptos/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const aptosConfig: CurrencyLiveConfigDefinition = {
  config_currency_aptos: {
    type: "object",
    default: aptosCoinConfig,
  },
};
