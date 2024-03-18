import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const internetComputerConfig: Record<string, ConfigInfo> = {
  config_currency_internet_computer: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
