import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const tronConfig: Record<string, ConfigInfo> = {
  config_currency_tron: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
