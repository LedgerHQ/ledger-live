import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const cantonConfig: Record<string, ConfigInfo> = {
  config_currency_canton: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
