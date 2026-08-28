import {
  Account,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "casper";

export type CasperAccount = Account;

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  memoType?: string | null;
  memoValue?: string | null;
  /** @deprecated Use `memoValue` instead; normalized by `prepareTransaction`. */
  transferId?: string;
};

export type CasperOperation = Operation<CasperOperationExtra>;

interface CasperOperationExtra {
  transferId?: string;
}

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  memoType?: string | null;
  memoValue?: string | null;
  /** @deprecated Accepted on inbound payloads; normalized in `fromTransactionRaw`. */
  transferId?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
