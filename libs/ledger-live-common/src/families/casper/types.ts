import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "casper";

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  transferId?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  transferId?: string;
  fees: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
