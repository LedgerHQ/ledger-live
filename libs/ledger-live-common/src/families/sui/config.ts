import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

// `features.graphql` is intentionally NOT defaulted here — it's an app-level
// runtime concern owned by the `suiGraphqlTransport` feature flag and
// injected via `setSuiGraphqlEnabled` in `setup.ts`.
export const suiConfig: Record<string, ConfigInfo> = {
  config_currency_sui: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
        graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
      },
    },
  },
  config_currency_sui_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        url: getEnv("API_SUI_TESTNET_NODE_PROXY"),
        graphqlUrl: getEnv("API_SUI_TESTNET_GRAPHQL_PROXY"),
      },
    },
  },
};
