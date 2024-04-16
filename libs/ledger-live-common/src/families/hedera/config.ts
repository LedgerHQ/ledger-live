import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const hederaConfig: Record<string, ConfigInfo> = {
  config_currency_hedera: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
