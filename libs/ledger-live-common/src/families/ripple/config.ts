import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const rippleConfig: Record<string, ConfigInfo> = {
  config_currency_ripple: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
