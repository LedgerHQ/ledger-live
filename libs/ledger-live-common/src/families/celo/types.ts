import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export type Transaction = TransactionCommon & {
  family: "celo";
  fees: BigNumber | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "celo";
  fees: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CeloAccount = Account;

export type CeloAccountRaw = AccountRaw;
