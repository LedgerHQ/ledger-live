import { FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import type {
  Account,
  Operation,
  OperationType,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { Horizon } from "@stellar/stellar-sdk";
import type { BigNumber } from "bignumber.js";

export type NetworkInfo = {
  family: "stellar";
  fees: BigNumber;
  baseFee: BigNumber;
  baseReserve: BigNumber;
  networkCongestionLevel?: NetworkCongestionLevel | undefined;
};

export type NetworkInfoRaw = {
  family: "stellar";
  fees: string;
  baseFee: string;
  baseReserve: string;
  networkCongestionLevel?: NetworkCongestionLevel | undefined;
};

export enum NetworkCongestionLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export const StellarMemoType = [
  "NO_MEMO",
  "MEMO_TEXT",
  "MEMO_ID",
  "MEMO_HASH",
  "MEMO_RETURN",
] as const;

// typesafe enum
export type StellarMemoKind = (typeof StellarMemoType)[number];

export type StellarMemo =
  | { type: "NO_MEMO" }
  | { type: Exclude<StellarMemoKind, "NO_MEMO">; value: string };

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

export type BalanceAsset = {
  balance: string;
  limit: string;
  buying_liabilities: string;
  selling_liabilities: string;
  last_modified_ledger: number;
  is_authorized: boolean;
  is_authorized_to_maintain_liabilities: boolean;
  asset_type: string;
  asset_code: string;
  asset_issuer: string;
  liquidity_pool_id?: string;
};

export type RawOperation = Horizon.ServerApi.OperationRecord & {
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  to_muxed?: string;
  funder?: string;
  trustor?: string;
  account?: string;
  transaction_successful: boolean;
};

export type Signer = {
  weight: number;
  key: string;
  type: string;
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
};

export type StellarAccount = Account;
