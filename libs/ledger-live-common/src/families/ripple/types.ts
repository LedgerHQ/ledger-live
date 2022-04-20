import type { BigNumber } from "bignumber.js";
import type { Unit } from "../../types";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type NetworkInfo = {
  family: "ripple";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};
export type NetworkInfoRaw = {
  family: "ripple";
  serverFee: string;
  baseReserve: string;
};
export type Transaction = TransactionCommon & {
  family: "ripple";
  fee: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "ripple";
  fee: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};
