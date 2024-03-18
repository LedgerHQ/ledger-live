import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const stellarConfig: Record<string, ConfigInfo> = {
  config_currency_stellar: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
