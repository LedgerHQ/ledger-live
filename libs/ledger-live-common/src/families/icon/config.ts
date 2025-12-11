import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const iconConfig: Record<string, ConfigInfo> = {
  config_currency_icon: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
