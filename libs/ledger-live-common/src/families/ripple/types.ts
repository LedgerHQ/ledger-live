import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

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
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type RippleAccount = Account;
export type RippleAccountRaw = Account;
