import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import type {
  Account,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
export * from "./signer";
export * from "./bridge";

export type AptosTransaction = UserTransactionResponse & {
  block: {
    height: number;
    hash: string;
  };
};

export type AptosOperation = Operation;

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

export interface TransactionOptions {
  maxGasAmount: string;
  gasUnitPrice: string;
}

export type TransactionErrors = {
  maxGasAmount?: string;
  gasUnitPrice?: string;
};

export type Transaction = TransactionCommon & {
  mode: string;
  family: "aptos";
  fees?: BigNumber | null;
  options: TransactionOptions;
  errors?: TransactionErrors;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aptos";
  mode: string;
  fees?: string | null;
  options: string;
  errors?: string;
};

export type AptosFungibleStoreResourceData = {
  balance: BigNumber;
  frozen: boolean;
  metadata: { inner: string };
};

export type AptosFungibleoObjectCoreResourceData = {
  owner: string;
};

export type AptosMoveResourceData = {
  guid: { id: { addr: string; creation_num: string } };
};

export type AptosMoveResource = {
  [key: string]: AptosMoveResourceData;
};
