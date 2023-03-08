import type {
  TokenAccount,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction as ThorTransaction } from "thor-devkit";

export type NetworkInfo = {
  family: "ethereum";
};

export type TransactionMode = "send_vet" | "send_vtho";

export type Transaction = TransactionCommon & {
  family: "vechain";
  mode: TransactionMode;
  body: ThorTransaction.Body;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "vechain";
  mode: TransactionMode;
  body: ThorTransaction.Body;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TransactionInfo = {
  estimatedFees: BigNumber;
  isTokenAccount: boolean;
  amount: BigNumber;
  totalSpent: BigNumber;
  balance: BigNumber;
  spendableBalance: BigNumber;
  tokenAccount?: TokenAccount;
};
