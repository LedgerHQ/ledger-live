// @flow

import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type CoreStatics = {};

export type CoreAccountSpecifics = {};

export type CoreOperationSpecifics = {};

export type CoreCurrencySpecifics = {};

export type NetworkInfo = {|
  family: "neo",
|};

export type NetworkInfoRaw = {|
  family: "neo",
|};

export type Transaction = {|
  ...TransactionCommon,
  family: "neo",
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "neo",
|};

export const reflect = (_declare: *) => {};
