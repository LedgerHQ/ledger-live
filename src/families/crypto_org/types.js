// @flow
import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type CoreStatics = {};

export type CoreAccountSpecifics = {};

export type CoreOperationSpecifics = {};

export type CoreCurrencySpecifics = {};

export type CryptoOrgResources = {|
  bondedBalance: BigNumber,
  redelegatingBalance: BigNumber,
  unbondingBalance: BigNumber,
  commissions: BigNumber,
|};

export type CryptoOrgResourcesRaw = {|
  bondedBalance: string,
  redelegatingBalance: string,
  unbondingBalance: string,
  commissions: string,
|};

export type Transaction = {|
  ...TransactionCommon,
  family: "crypto_org",
  mode: string,
  fees: ?BigNumber,
  // add here all transaction-specific fields if you implement other modes than "send"
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "crypto_org",
  mode: string,
  fees: ?string,
  // also the transaction fields as raw JSON data
|};

export type CryptoOrgPreloadData = {||};

export type NetworkInfo = {|
  family: "crypto_org",
|};

export type NetworkInfoRaw = {|
  family: "crypto_org",
|};


export const reflect = (_declare: *) => {};
