import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";

// dead address that receives 1 tinybar from tx that is made to trigger rewards claiming
const HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID = "0.0.163372";

// hedera staking ledger node id, used to determine the default validator
const HEDERA_STAKING_LEDGER_NODE_ID = -1;

// Minimum USD value an account must hold to perform a token association
const HEDERA_TOKEN_ASSOCIATION_MIN_USD = 0.05;

export const hederaConfig: Record<string, ConfigInfo> = {
  config_currency_hedera: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Hedera",
      unit: { name: "HBAR", code: "HBAR", magnitude: 8 },
      useNetworkTimestamp: true,
      networkType: "mainnet",
      claimRewardsRecipient: HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID,
      ledgerNodeId: HEDERA_STAKING_LEDGER_NODE_ID,
      tokenAssociationMinUsd: HEDERA_TOKEN_ASSOCIATION_MIN_USD,
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
      name: "Hedera (Testnet)",
      unit: { name: "HBAR", code: "HBAR", magnitude: 8 },
      useNetworkTimestamp: true,
      networkType: "testnet",
      claimRewardsRecipient: HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID,
      ledgerNodeId: HEDERA_STAKING_LEDGER_NODE_ID,
      tokenAssociationMinUsd: HEDERA_TOKEN_ASSOCIATION_MIN_USD,
      apiUrls: {
        mirrorNode: getEnv("API_HEDERA_MIRROR_TESTNET"),
        hgraph: getEnv("API_HEDERA_HGRAPH_TESTNET"),
      },
    },
  },
};
