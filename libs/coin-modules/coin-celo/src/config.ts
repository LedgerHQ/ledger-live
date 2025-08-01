import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const celoConfig: Record<string, ConfigInfo> = {
  config_currency_celo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://celo.coin.ledger.com/archive",
      },
      explorer: {
        type: "blockscout",
        uri: "https://celo.blockscout.com/api",
      },
    },
  },
};
