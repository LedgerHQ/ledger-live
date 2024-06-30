import type { BigNumber } from "bignumber.js";
import {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type Transaction = TransactionCommon & {
  family: "mina";
  fees: BigNumber;
  memo?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "mina";
  fees: string;
  memo?: string;
};

export type MinaAccount = Account;

export type MinaAPIAccount = {
  blockHeight: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
};

export type MinaAccountRaw = AccountRaw;

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
  transaction?: Error;
};

export type MinaUnsignedTransaction = {
  txType: number;
  senderAccount: number;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  fee: number;
  nonce: number;
  memo: string;
  networkId: number;
};

export interface MinaSignedTransaction {
  signature: string;
  transaction: MinaUnsignedTransaction;
}

export type MinaOperation = Operation<{ memo?: string }>;
