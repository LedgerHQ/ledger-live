import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "dfinity";

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  memo?: string;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  memo?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
