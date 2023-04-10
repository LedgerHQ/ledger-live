import type { BigNumber } from "bignumber.js";
import type { Types as AptosTypes } from "aptos";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type AptosTransaction = AptosTypes.UserTransaction & {
  block: {
    height: number;
    hash: string;
  };
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type AptosCoinStoreResource = {
  coin: {
    value: string;
  };
};

export type AptosResource<T extends Record<string, any> = any> = {
  data: T;
  type: string;
};

export type Transaction = TransactionCommon & {
  mode: string;
  family: "aptos";
  fees?: BigNumber | null;
  gasLimit?: string;
  gasUnitPrice?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aptos";
  mode: string;
  fees?: string | null;
  gasLimit?: string;
  gasUnitPrice?: string;
};
