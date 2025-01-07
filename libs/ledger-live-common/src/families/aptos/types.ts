import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import type {
  Account,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type AptosTransaction = UserTransactionResponse & {
  block: {
    height: number;
    hash: string;
  };
};

export type AptosAccount = Account;

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type AptosCoinStoreResource = {
  coin: {
    value: string;
  };
};

export type AptosResource<T extends Record<string, any> = any> = {
  data: T;
  type: string;
};

export type AptosAddress = {
  address: string;
  publicKey: string;
  path: string;
};

export interface TransactionEstimate {
  maxGasAmount: string;
  gasUnitPrice: string;
  //sequenceNumber?: string;
  //expirationTimestampSecs?: string;
}

export type TransactionOptions = {
  maxGasAmount: string; // where we use it - to get tx status
  gasUnitPrice: string; // where we use it - to get tx status, estimate used to calc max sendable
  sequenceNumber?: string; // where we use it - to compose cache key
  expirationTimestampSecs?: string; // where we use it - to compose cache key
};

export type TransactionErrors = {
  maxGasAmount?: string;
  gasUnitPrice?: string;
  sequenceNumber?: string;
  expirationTimestampSecs?: string;
};

export type Transaction = TransactionCommon & {
  mode: string;
  family: "aptos";
  fees?: BigNumber | null;
  //options: TransactionOptions;
  estimate: TransactionEstimate;
  firstEmulation: boolean;
  errors?: TransactionErrors;
  tag?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aptos";
  mode: string;
  fees?: string | null;
  //options: string;
  estimate: string;
  firstEmulation: string;
  errors?: string;
};
