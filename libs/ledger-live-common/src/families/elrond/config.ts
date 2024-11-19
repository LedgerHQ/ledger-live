import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const elrondConfig: Record<string, ConfigInfo> = {
  config_currency_elrond: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
