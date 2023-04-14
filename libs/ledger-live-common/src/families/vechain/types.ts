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

export type Transaction = TransactionCommon & {
  family: "vechain";
  estimatedFees: BigNumber;
  body: ThorTransaction.Body;
  // networkInfo property is just a work-around to display fees on mobile, more info here: apps/ledger-live-mobile/src/components/SendRowsFee.tsx
  networkInfo: boolean;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "vechain";
  estimatedFees: BigNumber;
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
};
