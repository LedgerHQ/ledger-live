import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const celoConfig: Record<string, ConfigInfo> = {
  config_currency_celo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
