import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const tezosConfig: Record<string, ConfigInfo> = {
  config_currency_tezos: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
