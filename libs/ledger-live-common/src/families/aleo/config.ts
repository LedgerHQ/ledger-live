import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const aleoConfig: Record<string, ConfigInfo> = {
  config_currency_aleo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
