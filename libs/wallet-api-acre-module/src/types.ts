import { RawTransaction } from "@ledgerhq/wallet-api-core";

export enum AcreMessageType {
  Withdraw = "Withdraw",
  SignIn = "SignIn",
}

// Duplicate type from https://github.com/blooo-io/hw-app-acre/blob/5ec9fb369e64518502563e006d2b5ab236bf2d53/src/types.ts#L43-L54
// Avoid installing a dependency just for one type in this lib
export interface AcreWithdrawalData {
  to: string;
  value: string;
  data: string;
  operation: string;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: string;
  nonce: string;
}

export type AcreMessageWithdraw = {
  type: AcreMessageType.Withdraw;
  message: AcreWithdrawalData;
};

// No types for SignIn message currently
export type AcreMessageSignIn = { type: AcreMessageType.SignIn; message: unknown };

export type AcreMessage = AcreMessageWithdraw | AcreMessageSignIn;

export type SignOptions = {
  hwAppId?: string;
  dependencies?: string[];
};

export type MessageSignParams = {
  accountId: string;
  message: AcreMessage;
  derivationPath?: string;
  options?: SignOptions;
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
