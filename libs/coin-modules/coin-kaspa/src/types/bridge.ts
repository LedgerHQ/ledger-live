import type {
  Account,
  SignedOperation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type KaspaAccount = Account & {
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

export type KaspaTransaction = TransactionCommon & {
  family: "kaspa";
  feerate: number | null;
  rbf: boolean;
};

export type KaspaTransactionRaw = TransactionCommonRaw & {
  family: "kaspa";
  feerate: number | null;
  rbf: boolean;
};

export type KaspaTransactionStatus = TransactionStatusCommon;
export type KaspaTransactionStatusRaw = TransactionStatusCommonRaw;
