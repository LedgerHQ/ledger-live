import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "concordium";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "concordium";
  serverFee: string;
  baseReserve: string;
};

export type Transaction = TransactionCommon & {
  family: "concordium";
  fee: BigNumber | null | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "concordium";
  fee: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
