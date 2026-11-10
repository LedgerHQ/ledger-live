import { stacksDefaults } from "@ledgerhq/coin-stacks/config";
import type { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { currencyDefaultsToLiveConfig } from "../../config";

export const stacksConfig: ConfigSchema = {
  config_stacks_generic_bridge: {
    type: "boolean",
    default: true,
  },
  ...currencyDefaultsToLiveConfig(stacksDefaults),
};
