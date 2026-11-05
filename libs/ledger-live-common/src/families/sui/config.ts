import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

// `features.transport` is intentionally NOT defaulted here — it's an app-level
// runtime concern owned by the `suiTransport` feature flag and injected via
// `setSuiTransport` in `setup.ts`.
export const suiConfig: Record<string, ConfigInfo> = {
  config_currency_sui: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Sui",
      unit: { name: "Sui", code: "SUI", magnitude: 9 },
      node: {
        graphqlUrl: "https://sui.coin.ledger.com/graphql",
        grpcUrl: "https://sui.coin.ledger.com",
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
      name: "Sui (Testnet)",
      unit: { name: "Sui", code: "SUI", magnitude: 9 },
      node: {
        graphqlUrl: "https://graphql.testnet.sui.io/graphql",
        grpcUrl: "https://fullnode.testnet.sui.io:443",
      },
    },
  },
};
