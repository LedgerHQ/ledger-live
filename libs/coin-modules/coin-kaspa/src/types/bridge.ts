import type {
  Account,
  SignedOperation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export type KaspaAccount = Account & {
  xpub: string;
  lastSyncTimestamp: string;
  activeAddressCount: number; // good to approximate the fee
  nextChangeAddress: string;
  nextChangeAddressType: number;
  nextChangeAddressIndex: number;
  nextReceiveAddress: string;
  nextReceiveAddressType: number;
  nextReceiveAddressIndex: number;
};

export type KaspaSignedOperation = SignedOperation & {
  signedTxJson: string;
};

export type Transaction = TransactionCommon & {
  family: "kaspa";
  networkInfo: {
    label: string;
    amount: BigNumber;
    estimatedSeconds: number;
  }[];
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "kaspa";
  networkInfo: {
    label: string;
    amount: string;
    estimatedSeconds: number;
  }[];
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
