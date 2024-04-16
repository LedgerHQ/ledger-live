import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const elrondConfig: Record<string, ConfigInfo> = {
  config_currency_elrondConfig: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
