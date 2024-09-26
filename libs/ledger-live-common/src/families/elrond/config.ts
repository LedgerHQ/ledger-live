import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const multiversxConfig: Record<string, ConfigInfo> = {
  config_currency_elrond: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
