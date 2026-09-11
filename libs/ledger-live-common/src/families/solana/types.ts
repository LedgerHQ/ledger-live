import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";
import type { TransferFee } from "../../bridge/generic-coin-framework/types";

// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-solana/types";

export type SolanaTransactionMode =
  | "send"
  | "stake"
  | "delegate"
  | "undelegate"
  | "unstake"
  | "opt-in"
  | "approve"
  | "revoke"
  | "split";

export type Transaction = TransactionCommon & {
  family: "solana";
  mode?: SolanaTransactionMode;
  memoType?: string | null;
  memoValue?: string | null;
  assetReference?: string;
  assetOwner?: string;
  familySpecificData?: { stakeAccountSeed?: string };
  feeParameters?: { stakeAccountAddress?: string };
  transferFee?: TransferFee;
  stakeAccountRent?: BigNumber;
  ownerTokenAccount?: string;
  raw?: string;
  templateId?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "solana";
  mode?: SolanaTransactionMode;
  assetReference?: string;
  assetOwner?: string;
  memoType?: string | null;
  memoValue?: string | null;
  familySpecificData?: { stakeAccountSeed?: string };
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
