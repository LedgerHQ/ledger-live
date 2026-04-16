import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type Transaction = TransactionCommon & {
  family: "tempo";
  fee: BigNumber | null | undefined;
  feeToken: string | null;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "tempo";
  fee: string | null | undefined;
  feeToken: string | null;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
