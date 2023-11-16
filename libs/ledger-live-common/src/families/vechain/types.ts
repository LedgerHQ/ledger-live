import type {
  TokenAccount,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction as ThorTransaction } from "thor-devkit";

export type Transaction = TransactionCommon & {
  family: "vechain";
  estimatedFees: string;
  body: ThorTransaction.Body;
};

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
  tokenAccount?: TokenAccount;
  estimatedFees: string;
  estimatedGas: number;
};
