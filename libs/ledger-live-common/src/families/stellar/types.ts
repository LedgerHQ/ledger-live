// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-stellar/types/index";

import { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
  OperationType,
} from "@ledgerhq/types-live";
import type { NetworkInfo, NetworkInfoRaw, StellarMemo } from "@ledgerhq/coin-stellar/types";
import type { BigNumber } from "bignumber.js";

export type StellarTransactionMode = "send" | "changeTrust";

export type Transaction = TransactionCommon & {
  family: "stellar";
  networkInfo?: NetworkInfo | null | undefined;
  customFees?: FeeEstimation;
  fees?: BigNumber | null;
  baseReserve?: BigNumber | null;
  memoType?: string | null;
  memoValue?: string | null;
  mode: StellarTransactionMode;
  assetReference?: string;
  assetOwner?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "stellar";
  networkInfo?: NetworkInfoRaw | null | undefined;
  fees?: string | null;
  baseReserve?: string | null;
  memoType?: string | null;
  memoValue?: string | null;
  mode: StellarTransactionMode;
  assetReference?: string;
  assetOwner?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StellarOperation = Operation<StellarOperationExtra>;

export type StellarOperationExtra = {
  pagingToken?: string;
  assetCode?: string;
  assetIssuer?: string;
  assetAmount?: string | undefined;
  ledgerOpType: OperationType;
  memo?: StellarMemo;
  blockTime: Date;
  index: string;
  /**
   * The Stellar account (G...) that paid the network fees for this transaction.
   *
   * Comes from the Horizon API's `transaction.fee_account` field, introduced in protocol v13 (CAP-0015).
   * Always present on every transaction record (for pre-v13 transactions, retroactively set to `source_account`).
   *
   * - For regular transactions: `fee_account === source_account` (the transaction creator pays the fees).
   * - For fee bump transactions (CAP-0015): `fee_account` is the bumper account that sponsored the fees,
   *   which differs from `source_account` (the original transaction creator).
   * - For multi-operation transactions: all operations share the same transaction-level `fee_account`,
   *   even though each operation may have its own `source_account`.
   */
  feeAccount?: string;
};

export interface StellarSigner {
  getPublicKey(path: string, display?: boolean): Promise<{ rawPublicKey: Buffer }>;
  signTransaction(
    path: string,
    transaction: Buffer,
  ): Promise<{
    signature: Buffer;
  }>;
}
