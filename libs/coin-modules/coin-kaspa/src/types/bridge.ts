import type {
  Account,
  SignedOperation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type KaspaAccount = Account & {
  xpub: string;
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
  feerate: number | null;
  rbf: boolean;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "kaspa";
  feerate: number | null;
  rbf: boolean;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
