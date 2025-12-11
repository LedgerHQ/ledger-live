import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const stacksConfig: Record<string, ConfigInfo> = {
  config_currency_stacks: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
