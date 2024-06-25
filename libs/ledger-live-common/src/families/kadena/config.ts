import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const kadenaConfig: Record<string, ConfigInfo> = {
  config_currency_kadena: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
