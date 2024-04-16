import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const casperConfig: Record<string, ConfigInfo> = {
  config_currency_casper: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
