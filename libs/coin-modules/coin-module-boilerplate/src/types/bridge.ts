import type {
  Account,
  AccountBridge,
  Bridge,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type NetworkInfo = {
  family: "boilerplate";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "boilerplate";
  serverFee: string;
  baseReserve: string;
};

export type Transaction = TransactionCommon & {
  family: "boilerplate";
  fee: BigNumber | null | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "boilerplate";
  fee: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type BoilerplateAccountBridge = AccountBridge<Transaction, Account, TransactionStatus>;
export type BoilerplateBridge = Bridge<Transaction, TransactionRaw>;
