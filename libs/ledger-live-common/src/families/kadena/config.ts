import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const kadenaConfig: Record<string, ConfigInfo> = {
  config_currency_kadena: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      infra: {
        API_KADENA_ENDPOINT: "https://api.mainnet.kadindexer.io/v0",
        API_KEY_KADENA_ENDPOINT: "ZKa7chNjDf3Q7vhuuzlll2sQxVSPCwko41hR2tMe",
        API_KADENA_PACT_ENDPOINT: "https://api.chainweb.com",
      },
    },
  },
};
