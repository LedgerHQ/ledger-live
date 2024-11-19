import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const solanaConfig: Record<string, ConfigInfo> = {
  config_currency_solana: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
