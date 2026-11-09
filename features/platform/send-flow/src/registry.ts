import type BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** The host's account and transaction types, registered once by augmenting this interface (see README). */
// oxlint-disable-next-line typescript/no-empty-object-type, typescript/no-empty-interface
export interface SendFlowTypeRegistry {}

type Registered<K extends PropertyKey, Fallback> =
  SendFlowTypeRegistry extends Record<K, infer T> ? T : Fallback;

export type SendOperationBase = {
  id: string;
  hash: string;
  type: string;
  value: BigNumber;
  fee: BigNumber;
  senders: string[];
  recipients: string[];
  blockHeight: number | null | undefined;
  blockHash: string | null | undefined;
  transactionSequenceNumber?: BigNumber | undefined;
  accountId: string;
  date: Date;
  extra: unknown;
};

export type SendTokenAccountBase = {
  type: "TokenAccount";
  id: string;
  parentId: string;
  token: TokenCurrency;
  balance: BigNumber;
  spendableBalance: BigNumber;
  pendingOperations: SendOperationBase[];
};

export type SendAccountBase = {
  type: "Account";
  id: string;
  currency: CryptoCurrency;
  freshAddress: string;
  balance: BigNumber;
  spendableBalance: BigNumber;
  pendingOperations: SendOperationBase[];
  subAccounts?: SendTokenAccountBase[];
};

export type SendTransactionBase = {
  family: string;
  amount: BigNumber;
  recipient: string;
  recipientDomain?: { domain: string } | undefined;
  useAllAmount?: boolean;
  subAccountId?: string | null | undefined;
  feesStrategy?: "slow" | "medium" | "fast" | "custom" | null | undefined;
  utxoStrategy?: { strategy: number } | null;
  gasLimit?: BigNumber | null;
  gasPrice?: BigNumber | null;
  type?: number;
};

export type SendTransactionStatusBase = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
  feeCurrencyAccountId?: string | null | undefined;
};

export type SendSignedOperationBase = {
  operation: SendOperationBase;
  signature: string;
};

export type SendAccount = Registered<"account", SendAccountBase>;
export type SendTokenAccount = Registered<"tokenAccount", SendTokenAccountBase>;
export type SendAccountLike = SendAccount | SendTokenAccount;
export type SendTransaction = Registered<"transaction", SendTransactionBase>;
export type SendTransactionStatus = Registered<"transactionStatus", SendTransactionStatusBase>;
export type SendOperation = Registered<"operation", SendOperationBase>;
export type SendSignedOperation = Registered<"signedOperation", SendSignedOperationBase>;

export type SendAccountBridgeBase = {
  createTransaction(account: SendAccountLike): SendTransaction;
  updateTransaction(transaction: SendTransaction, patch: Partial<SendTransaction>): SendTransaction;
  prepareTransaction(account: SendAccount, transaction: SendTransaction): Promise<SendTransaction>;
  getTransactionStatus(
    account: SendAccount,
    transaction: SendTransaction,
  ): Promise<SendTransactionStatus>;
};

export type SendAccountBridge = Registered<"accountBridge", SendAccountBridgeBase>;
