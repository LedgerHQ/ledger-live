import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const polkadotConfig: Record<string, ConfigInfo> = {
  config_currency_polkadot: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
