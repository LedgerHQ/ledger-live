// @flow

import type { BigNumber } from "bignumber.js";
import type {
  Unit,
  Account,
  TransactionStatus,
  TokenCurrency,
  Operation,
} from "../../types";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type {
  CoreAmount,
  CoreBigInt,
  OperationType,
  Spec,
} from "../../libcore/types";
import type { TransactionMode, ModeModule } from "./modules";
import type { Range, RangeRaw } from "../../range";

export type EthereumGasLimitRequest = {
  from?: string,
  to?: string,
  value?: string,
  data?: string,
  gas?: string,
  gasPrice?: string,
  amplifier: string,
};

export type NetworkInfo = {|
  family: "ethereum",
  gasPrice: Range,
|};

export type NetworkInfoRaw = {|
  family: "ethereum",
  gasPrice: RangeRaw,
|};

export type { TransactionMode, ModeModule };

export type Transaction = {|
  ...TransactionCommon,
  family: "ethereum",
  mode: TransactionMode,
  nonce?: number,
  data?: Buffer,
  gasPrice: ?BigNumber,
  userGasLimit: ?BigNumber,
  estimatedGasLimit: ?BigNumber,
  feeCustomUnit: ?Unit,
  networkInfo: ?NetworkInfo,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "ethereum",
  mode: TransactionMode,
  nonce?: number,
  data?: string,
  gasPrice: ?string,
  userGasLimit: ?string,
  estimatedGasLimit: ?string,
  feeCustomUnit: ?Unit,
  networkInfo: ?NetworkInfoRaw,
|};

//

export type CoreStatics = {};
export type CoreAccountSpecifics = {};
export type CoreOperationSpecifics = {};
export type CoreCurrencySpecifics = {};
export const reflect = (_declare: *) => {};
