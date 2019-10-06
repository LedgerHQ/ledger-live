// @flow

import type {
  TransactionCommon,
  TransactionCommonRaw
} from "../../types/transaction";

export type CoreStatics = {};

export type CoreAccountSpecifics = {};

export type CoreOperationSpecifics = {};

export type CoreCurrencySpecifics = {};

export type NetworkInfo = {|
  family: "tron"
|};

export type NetworkInfoRaw = {|
  family: "tron"
|};

export type Transaction = {|
  ...TransactionCommon,
  family: "tron"
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "tron"
|};

export const reflect = (_declare: *) => {};
