import buildCoinConfig, { type CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { TRANSACTION_TYPE } from "./constants";
import type { AleoCoinConfig, TransactionType } from "./types";

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AleoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => AleoCoinConfig;
} = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;

// API for fee estimation is not available yet, so for MVP we are using static fee configuration.
// source of hardcoded values: https://ledgerhq.atlassian.net/wiki/spaces/BI/pages/6218678344/ARCH+-+Aleo+integration+HLD
// should be removed once https://ledgerhq.atlassian.net/browse/LIVE-30580 is completed
const DEFAULT_FEE_BY_TRANSACTION_TYPE: Record<TransactionType, number> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 17972,
  // measured from single-transition testnet transactions (credits.aleo, fee_public, priority fee 0),
  [TRANSACTION_TYPE.BOND_PUBLIC]: 5621,
  [TRANSACTION_TYPE.UNBOND_PUBLIC]: 10813,
  [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: 3066,
};

/** Both are required on the config, so these only stand in until it has loaded. */
export const LIVE_BLOCK_HEIGHT_POLL_MS = 10_000;

/** Once spent, a settled unbonding entry is left to the background sync to pick up. */
export const MAX_UNBONDING_SYNC_ATTEMPTS = 3;

const MAINNET_DEFAULT_VALIDATOR = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";
const TESTNET_DEFAULT_VALIDATOR = "aleo1l7avejc23yv6e8nx4udjwz89dw6mg95dzsp936hf77yuhnjywv9syl0ywc";

const aleoCommon = {
  status: { type: "active" },
  unit: { name: "Aleo", code: "ALEO", magnitude: 6 },
  feeByTransactionType: DEFAULT_FEE_BY_TRANSACTION_TYPE,
  feeSafetyMultiplier: 1,
  // Fee sponsorship for single-record private transactions (fees paid by a 3rd party).
  // https://ledgerhq.atlassian.net/browse/LIVE-27354
  isFeeSponsored: true,
  enableTokens: false,
  enableStaking: false,
  // Target solution once the API-side fix is done.
  // https://ledgerhq.atlassian.net/browse/LIVE-27542
  useEncryptedProve: true,
  // "manual": user picks records through the record picker step; "auto": selected automatically.
  recordPickingStrategy: "auto",
  liveBlockHeightPollMs: LIVE_BLOCK_HEIGHT_POLL_MS,
  maxUnbondingSyncAttempts: MAX_UNBONDING_SYNC_ATTEMPTS,
} as const;

export const aleoDefaults = {
  aleo: {
    ...aleoCommon,
    name: "Aleo",
    networkType: "mainnet",
    defaultValidator: MAINNET_DEFAULT_VALIDATOR,
    apiUrls: {
      node: "https://aleo.coin.ledger.com",
      sdk: "https://aleo-backend.api.live.ledger.com/network/mainnet",
    },
  },
  aleo_testnet: {
    ...aleoCommon,
    name: "Aleo (Testnet)",
    networkType: "testnet",
    defaultValidator: TESTNET_DEFAULT_VALIDATOR,
    apiUrls: {
      node: "https://aleo.coin.ledger.com",
      sdk: "https://aleo-backend.api.live.ledger.com/network/testnet",
    },
  },
} satisfies Record<string, AleoCoinConfig>;
