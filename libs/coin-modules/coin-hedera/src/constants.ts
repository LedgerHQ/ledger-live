import BigNumber from "bignumber.js";
import type { OperationType } from "@ledgerhq/types-live";

/**
 * Internal types to distinguish custom Hedera transaction behaviors.
 * These can be used in transaction.mode and used to route specific preparation logic.
 */
export enum HEDERA_TRANSACTION_MODES {
  Send = "send",
  TokenAssociate = "token-associate",
  Delegate = "delegate",
  Undelegate = "undelegate",
  Redelegate = "redelegate",
  ClaimRewards = "claim-rewards",
}

/**
 * Enum representing Hedera transaction names used in the Hedera Mirror Node API.
 */
export enum HEDERA_TRANSACTION_NAMES {
  ContractCall = "CONTRACTCALL",
  UpdateAccount = "CRYPTOUPDATEACCOUNT",
}

/**
 * Enum representing the supported Hedera operation types for fee estimation
 */
export enum HEDERA_OPERATION_TYPES {
  CryptoUpdate = "CryptoUpdate",
  CryptoTransfer = "CryptoTransfer",
  TokenTransfer = "TokenTransfer",
  TokenAssociate = "TokenAssociate",
  ContractCall = "ContractCall",
}

export const TINYBAR_SCALE = 8;

// old value moved from https://github.com/LedgerHQ/ledger-live/blob/8447b68b7c6f1e7ccd4aa9db4da0e6c8de36a88e/libs/coin-modules/coin-hedera/src/bridge/utils.ts#L77
export const DEFAULT_TINYBAR_FEE = 150200;

export const SYNTHETIC_BLOCK_WINDOW_SECONDS = 10;

export const ERC20_TRANSFER_EVENT_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const ESTIMATED_GAS_SAFETY_RATE = 1.2;

export const ESTIMATED_FEE_SAFETY_RATE = 2;

export const DEFAULT_GAS_LIMIT = new BigNumber(100_000);

export const DEFAULT_GAS_PRICE_TINYBARS = new BigNumber(100);

export const HEDERA_MAINNET_CHAIN_ID = 295;

export const MEMO_CHARACTER_LIMIT = 100;

/**
 * Enum representing the delegation status of a Hedera account
 */
export enum HEDERA_DELEGATION_STATUS {
  Inactive = "inactive",
  Overstaked = "overstaked",
  Active = "active",
}

/**
 * https://docs.hedera.com/hedera/networks/mainnet/fees
 *
 * These are Hedera's estimated fee costs in USD, scaled to tinybars (1 HBAR = 10^8 tinybars),
 * so they can be converted into actual HBAR amounts based on current USD/crypto rates.
 *
 * Used in fee estimation logic (estimateFees function) to determine whether an account
 * has sufficient balance to cover the cost of a transaction (e.g. token association).
 */
export const BASE_USD_FEE_BY_OPERATION_TYPE = {
  [HEDERA_OPERATION_TYPES.CryptoUpdate]: 0.00022 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.CryptoTransfer]: 0.0001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenTransfer]: 0.001 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.TokenAssociate]: 0.05 * 10 ** TINYBAR_SCALE,
  [HEDERA_OPERATION_TYPES.ContractCall]: 0, // Contract call fees are based on gas used and are handled separately
} as const satisfies Record<HEDERA_OPERATION_TYPES, number>;

/**
 * Array of supported ERC20 token IDs for Hedera.
 *
 * This is a temporary solution to allow bypassing deprecated methods.
 * It is essential to update this list in the future to ensure support
 * for other erc20 tokens.
 */
export const SUPPORTED_ERC20_TOKENS = [
  {
    id: "hedera/erc20/weth_0xca367694cdac8f152e33683bb36cc9d6a73f1ef2",
    contractAddress: "0xca367694cdac8f152e33683bb36cc9d6a73f1ef2",
    tokenId: "0.0.9470869",
  },
  {
    id: "hedera/erc20/bonzo_atoken_usdc_0xb7687538c7f4cad022d5e97cc778d0b46457c5db",
    contractAddress: "0xb7687538c7f4cad022d5e97cc778d0b46457c5db",
    tokenId: "0.0.7308496",
  },
  {
    id: "hedera/erc20/audd_0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    contractAddress: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    tokenId: "0.0.8317070",
  },
  {
    id: "hedera/erc20/wrapped_btc_0xd7d4d91d64a6061fa00a94e2b3a2d2a5fb677849",
    contractAddress: "0xd7d4d91d64a6061fa00a94e2b3a2d2a5fb677849",
    tokenId: "0.0.10047837",
  },
];

export const MAP_STAKING_MODE_TO_MEMO: Record<string, string> = {
  [HEDERA_TRANSACTION_MODES.ClaimRewards]: "Collect Staking Rewards",
  [HEDERA_TRANSACTION_MODES.Delegate]: "Stake",
  [HEDERA_TRANSACTION_MODES.Undelegate]: "Unstake",
  [HEDERA_TRANSACTION_MODES.Redelegate]: "Restake",
} as const;

export const MAP_STAKING_MODE_TO_OPERATION_TYPE: Record<string, OperationType> = {
  [HEDERA_TRANSACTION_MODES.Delegate]: "DELEGATE",
  [HEDERA_TRANSACTION_MODES.Undelegate]: "UNDELEGATE",
  [HEDERA_TRANSACTION_MODES.Redelegate]: "REDELEGATE",
};

export const MAP_STAKING_MODE_TO_METHOD: Record<string, string> = {
  [HEDERA_TRANSACTION_MODES.Delegate]: "Delegate",
  [HEDERA_TRANSACTION_MODES.Undelegate]: "Undelegate",
  [HEDERA_TRANSACTION_MODES.Redelegate]: "Redelegate",
  [HEDERA_TRANSACTION_MODES.ClaimRewards]: "Claim Rewards",
};

/**
 * Operation types where fees should be excluded from value of native HBAR operations.
 */
export const OP_TYPES_EXCLUDING_FEES: OperationType[] = [
  "OUT",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "UPDATE_ACCOUNT",
  "CONTRACT_CALL",
];
