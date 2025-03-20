import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const suiConfig: Record<string, ConfigInfo> = {
  config_currency_sui: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
