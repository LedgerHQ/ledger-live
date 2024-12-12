import {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type CryptoOrgResources = {
  bondedBalance: BigNumber;
  redelegatingBalance: BigNumber;
  unbondingBalance: BigNumber;
  commissions: BigNumber;
};
export type CryptoOrgResourcesRaw = {
  bondedBalance: string;
  redelegatingBalance: string;
  unbondingBalance: string;
  commissions: string;
};
export type Transaction = TransactionCommon & {
  mode: string;
  family: "crypto_org";
  fees?: BigNumber; // add here all transaction-specific fields if you implement other modes than "send"
  memo: string | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "crypto_org";
  mode: string;
  fees?: string; // also the transaction fields as raw JSON data
  memo: string | null | undefined;
};
export type CryptoOrgPreloadData = Record<any, any>;
export type NetworkInfo = {
  family: "crypto_org";
};
export type NetworkInfoRaw = {
  family: "crypto_org";
};
export type CryptoOrgAccount = Account & {
  cryptoOrgResources: CryptoOrgResources;
};
export type CryptoOrgAccountRaw = AccountRaw & {
  cryptoOrgResources: CryptoOrgResourcesRaw;
};
export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CryptoOrgOperation = Operation<CryptoOrgOperationExtra>;

export type CryptoOrgOperationExtra = {
  memo?: string | null;
};
