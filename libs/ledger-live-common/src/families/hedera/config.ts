import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

export const hederaConfig: Record<string, ConfigInfo> = {
  config_currency_hedera: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      networkType: "mainnet",
      apiUrls: {
        mirrorNode: getEnv("API_HEDERA_MIRROR"),
        hgraph: getEnv("API_HEDERA_HGRAPH"),
      },
    },
  },
  config_currency_hedera_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      networkType: "testnet",
      apiUrls: {
        mirrorNode: getEnv("API_HEDERA_MIRROR_TESTNET"),
        hgraph: getEnv("API_HEDERA_HGRAPH_TESTNET"),
      },
    },
  },
};
