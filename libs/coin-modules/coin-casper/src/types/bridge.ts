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
  fees: BigNumber | null;
  transferId?: string;
  // Mirrors GenericTransaction.memoType/memoValue — required by genericSignOperation.
  memoType?: string | null;
  memoValue?: string | null;
  // Generic bridge fields preserved for serialization round-trip.
  mode?: string;
  nonce?: BigNumber | null;
};

export type CasperOperation = Operation<CasperOperationExtra>;

interface CasperOperationExtra {
  transferId?: string;
}

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  transferId?: string;
  fees: string | null;
  memoType?: string | null;
  memoValue?: string | null;
  mode?: string;
  nonce?: string | null;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
