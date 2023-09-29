import type { BigNumber } from "bignumber.js";
import type { Types as AptosTypes } from "aptos";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Account,
} from "@ledgerhq/types-live";

export type AptosTransaction = AptosTypes.UserTransaction & {
  block: {
    height: number;
    hash: string;
  };
};

export type AptosAccount = Account;

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

export interface TransactionEstimate {
  maxGasAmount: string;
  gasUnitPrice: string;
  sequenceNumber?: string;
  expirationTimestampSecs?: string;
}

interface TransactionOptions {
  maxGasAmount: string;
  gasUnitPrice: string;
  sequenceNumber?: string;
  expirationTimestampSecs?: string;
}

export type TransactionErrors = {
  maxGasAmount?: string;
  gasUnitPrice?: string;
  sequenceNumber?: string;
  expirationTimestampSecs?: string;
};

export type Transaction = TransactionCommon & {
  mode: string;
  family: "aptos";
  fees?: BigNumber | null;
  options: TransactionOptions;
  estimate: TransactionEstimate;
  skipEmulation?: boolean;
  firstEmulation: boolean;
  errors?: TransactionErrors;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aptos";
  mode: string;
  fees?: string | null;
  options: string;
  estimate: string;
  skipEmulation?: string;
  firstEmulation: string;
  errors?: string;
};
