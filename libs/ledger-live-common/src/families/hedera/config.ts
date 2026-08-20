import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";

export const hederaConfig: Record<string, ConfigInfo> = {
  config_currency_hedera: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      useNetworkTimestamp: true,
      networkType: "mainnet",
      claimRewardsRecipient: getEnv("HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID"),
      ledgerNodeId: getEnv("HEDERA_STAKING_LEDGER_NODE_ID"),
      tokenAssociationMinUsd: getEnv("HEDERA_TOKEN_ASSOCIATION_MIN_USD"),
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
      useNetworkTimestamp: true,
      networkType: "testnet",
      claimRewardsRecipient: getEnv("HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID"),
      ledgerNodeId: getEnv("HEDERA_STAKING_LEDGER_NODE_ID"),
      tokenAssociationMinUsd: getEnv("HEDERA_TOKEN_ASSOCIATION_MIN_USD"),
      apiUrls: {
        mirrorNode: getEnv("API_HEDERA_MIRROR_TESTNET"),
        hgraph: getEnv("API_HEDERA_HGRAPH_TESTNET"),
      },
    },
  },
};
