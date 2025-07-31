import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "canton";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "canton";
  serverFee: string;
  baseReserve: string;
};

export type Transaction = TransactionCommon & {
  family: "canton";
  fee: BigNumber | null | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "canton";
  fee: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
