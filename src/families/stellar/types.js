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

export type NetworkInfo = {|
  family: "stellar",
  fees: BigNumber,
  baseReserve: BigNumber,
|};

export type NetworkInfoRaw = {|
  family: "stellar",
  fees: string,
  baseReserve: string,
|};

export const StellarMemoType = [
  "NO_MEMO",
  "MEMO_TEXT",
  "MEMO_ID",
  "MEMO_HASH",
  "MEMO_RETURN",
];

export type Transaction = {|
  ...TransactionCommon,
  family: "stellar",
  networkInfo: ?NetworkInfo,
  fees: ?BigNumber,
  baseReserve: ?BigNumber,
  memoType: ?string,
  memoValue: ?string,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "stellar",
  networkInfo: ?NetworkInfoRaw,
  fees: ?string,
  baseReserve: ?string,
  memoType: ?string,
  memoValue: ?string,
|};

export const reflect = (_declare: *) => {};
