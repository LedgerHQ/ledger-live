import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const algorandConfig: Record<string, ConfigInfo> = {
  config_currency_algorand: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
