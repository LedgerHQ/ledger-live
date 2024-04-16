import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const cardanoConfig: Record<string, ConfigInfo> = {
  config_currency_cardano: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
