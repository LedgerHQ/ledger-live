import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const nearConfig: Record<string, ConfigInfo> = {
  config_currency_near: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
