import { casperDefaults } from "@ledgerhq/coin-casper/config";
import type { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { currencyDefaultsToLiveConfig } from "../../config";

export const casperConfig: ConfigSchema = {
  config_casper_generic_bridge: {
    type: "boolean",
    default: true,
  },
  ...currencyDefaultsToLiveConfig(casperDefaults),
};
