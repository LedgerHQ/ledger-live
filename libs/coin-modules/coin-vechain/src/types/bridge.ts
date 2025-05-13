import type {
  TokenAccount,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction as ThorTransaction } from "thor-devkit";

export function isVechainTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "vechain";
}
export type Transaction = TransactionCommon & {
  family: "vechain";
  estimatedFees: string;
  body: ThorTransaction.Body;
};

export function isVechainTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "vechain";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: "vechain";
  estimatedFees: string;
  body: ThorTransaction.Body;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TransactionInfo = {
  isTokenAccount: boolean;
  amount: BigNumber;
  balance: BigNumber;
  spendableBalance: BigNumber;
  tokenAccount: TokenAccount | undefined;
  estimatedFees: string;
  estimatedGas: number;
};
