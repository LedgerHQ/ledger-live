// @flow

import type { BigNumber } from "bignumber.js";

import type { SignedOperation } from "../types";

export type PlatformAccount = {
  id: string,
  name: string,
  address: string,
  currency: string,
  balance: BigNumber,
  spendableBalance: BigNumber,
  blockHeight: number,
  lastSyncDate: Date,
};

export type PlatformUnit = {
  name: string,
  code: string,
  magnitude: number,
};

export type PlatformCurrency = {
  type: string,
  color: string,
  ticker: string,
  id: string,
  name: string,
  family: string,
  units: PlatformUnit[],
};

export interface PlatformTransactionCommon {
  amount: BigNumber;
  recipient: string;
}

export interface PlatformEthereumTransaction extends PlatformTransactionCommon {
  family: "ethereum";
  nonce: ?number;
  data: ?Buffer;
  gasPrice: ?BigNumber;
  gasLimit: ?BigNumber;
}

export interface PlatformBitcoinTransaction extends PlatformTransactionCommon {
  family: "bitcoin";
  feePerByte: ?BigNumber;
}

export type PlatformTransaction =
  | PlatformEthereumTransaction
  | PlatformBitcoinTransaction;

export type PlatformSignedTransaction = SignedOperation;
