// @flow
import type { SignedOperationRaw } from "../types";

export type RawPlatformAccount = {
  id: string,
  name: string,
  address: string,
  currency: string,
  balance: string,
  spendableBalance: string,
  blockHeight: number,
  lastSyncDate: string,
};

export interface RawPlatformTransactionCommon {
  amount: string;
  recipient: string;
}

export interface RawPlatformEthereumTransaction
  extends RawPlatformTransactionCommon {
  family: "ethereum";
  nonce: ?number;
  data: ?string;
  gasPrice: ?string;
  gasLimit: ?string;
}

export interface RawPlatformBitcoinTransaction
  extends RawPlatformTransactionCommon {
  family: "bitcoin";
  feePerByte: ?string;
}

export type RawPlatformTransaction =
  | RawPlatformEthereumTransaction
  | RawPlatformBitcoinTransaction;

export type RawPlatformSignedTransaction = SignedOperationRaw;
