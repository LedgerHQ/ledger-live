import { RawTransaction } from "@ledgerhq/wallet-api-core";

export type MessageSignParams = {
  accountId: string;
  hexMessage: string;
  address: string;
  meta?: Record<string, unknown>;
};

export type MessageSignResult = {
  hexSignedMessage: string;
};

export type TransactionOptions = {
  hwAppId?: string;
  dependencies?: string[];
};

export type TransactionSignParams = {
  accountId: string;
  rawTransaction: RawTransaction;
  options?: TransactionOptions;
  meta?: Record<string, unknown>;
  tokenCurrency?: string;
};

export type TransactionSignResult = {
  signedTransactionHex: string;
};

export type TransactionSignAndBroadcastParams = {
  accountId: string;
  rawTransaction: RawTransaction;
  options?: TransactionOptions;
  meta?: Record<string, unknown>;
  tokenCurrency?: string;
};

export type TransactionSignAndBroadcastResult = {
  transactionHash: string;
};
