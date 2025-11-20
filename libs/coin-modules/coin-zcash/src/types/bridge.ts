import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "zcash";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "zcash";
  serverFee: string;
  baseReserve: string;
};

export type Transaction = TransactionCommon & {
  family: "zcash";
  fee: BigNumber | null | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "zcash";
  fee: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
