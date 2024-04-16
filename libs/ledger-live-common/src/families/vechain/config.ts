import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const vechainConfig: Record<string, ConfigInfo> = {
  config_currency_vechain: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
