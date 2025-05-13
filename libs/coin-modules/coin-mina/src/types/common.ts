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

export function isMinaTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "mina";
}
export type Transaction = TransactionCommon & {
  family: "mina";
  fees: {
    fee: BigNumber;
    accountCreationFee: BigNumber;
  };
  memo: string | undefined;
  nonce: number;
};

export function isMinaTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "mina";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: "mina";
  fees: {
    fee: string;
    accountCreationFee: string;
  };
  memo: string | undefined;
  nonce: number;
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

export type MinaOperationExtra = { memo: string | undefined; accountCreationFee: string };
export type MinaOperation = Operation<MinaOperationExtra>;
