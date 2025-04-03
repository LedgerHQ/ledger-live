import type { BigNumber } from "bignumber.js";
import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
  Bridge,
  AccountBridge,
} from "@ledgerhq/types-live";

/**
 * Icon account resources
 */
export type IconResources = {
  nonce: number;
  votingPower: string | BigNumber;
  totalDelegated: string | BigNumber;
};

/**
 * Icon account resources from raw JSON
 */
export type IconResourcesRaw = {
  nonce: number;
  votingPower: string | BigNumber;
  totalDelegated: string | BigNumber;
};

/**
 * Icon transaction
 */
export type Transaction = TransactionCommon & {
  mode: string;
  family: "icon";
  fees?: BigNumber | null | undefined;
  stepLimit?: BigNumber;
};

/**
 * Icon transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "icon";
  mode: string;
  fees?: string | null | undefined;
  stepLimit?: string;
  // also the transaction fields as raw JSON data
};

export type IconOperation = Operation;

export type IconAccount = Account & { iconResources: IconResources };

export type IconAccountRaw = AccountRaw & {
  iconResources: IconResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type IconAccountBridge = AccountBridge<Transaction, Account, TransactionStatus, AccountRaw>;
export type IconBridge = Bridge<Transaction, TransactionRaw, Account, AccountRaw>;
