import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const multiversxConfig: Record<string, ConfigInfo> = {
  config_currency_multiversx: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
