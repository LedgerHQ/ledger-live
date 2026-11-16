import { nearDefaults } from "@ledgerhq/coin-near/config";
import type { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { currencyDefaultsToLiveConfig } from "../../config";

export const nearConfig: ConfigSchema = {
  config_near_generic_bridge: {
    type: "boolean",
    default: false,
  },
  ...currencyDefaultsToLiveConfig(nearDefaults),
};
