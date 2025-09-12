import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const kaspaConfig: Record<string, ConfigInfo> = {
  config_currency_kaspa: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
