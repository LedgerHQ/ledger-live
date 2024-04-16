import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const cryptoOrgConfig: Record<string, ConfigInfo> = {
  config_currency_crypto_org: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
};
