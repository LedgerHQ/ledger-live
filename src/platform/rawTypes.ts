import type { SignedOperationRaw } from "../types";
export type RawPlatformAccount = {
  id: string;
  name: string;
  address: string;
  currency: string;
  balance: string;
  spendableBalance: string;
  blockHeight: number;
  lastSyncDate: string;
};
export interface RawPlatformTransactionCommon {
  amount: string;
  recipient: string;
}
export interface RawPlatformEthereumTransaction
  extends RawPlatformTransactionCommon {
  family: "ethereum";
  nonce: number | null | undefined;
  data: string | null | undefined;
  gasPrice: string | null | undefined;
  gasLimit: string | null | undefined;
}
export interface RawPlatformBitcoinTransaction
  extends RawPlatformTransactionCommon {
  family: "bitcoin";
  feePerByte: string | null | undefined;
}
export type RawPlatformTransaction =
  | RawPlatformEthereumTransaction
  | RawPlatformBitcoinTransaction;
export type RawPlatformSignedTransaction = SignedOperationRaw;
