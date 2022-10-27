import {
  Account,
  AccountLike,
  Operation,
  SignedOperation,
  TransactionCommon,
} from "@ledgerhq/types-live";

import {
  accountToWalletAPIAccount,
  getWalletAPITransactionSignFlowInfos,
} from "./converters";
import {
  RawWalletAPITransaction,
  RawWalletAPISignedTransaction,
} from "./rawTypes";
import {
  deserializeWalletAPITransaction,
  deserializeWalletAPISignedTransaction,
} from "./serializers";
import type { TrackingAPI } from "./tracking";
import { AppManifest, TranslatableString } from "./types";
import { isTokenAccount, getMainAccount, isAccount } from "../account/index";
import { getAccountBridge } from "../bridge/index";
import { Transaction } from "../generated/types";
import { MessageData } from "../hw/signMessage/types";
import { prepareMessageToSign } from "../hw/signMessage/index";
import { TypedMessageData } from "../families/ethereum/types";

export function translateContent(
  content: string | TranslatableString,
  locale = "en"
): string {
  if (!content || typeof content === "string") return content;
  return content[locale] || content.en;
}

export type WalletAPIContext = {
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
};

function getParentAccount(
  account: AccountLike,
  fromAccounts: AccountLike[]
): Account | null {
  return isTokenAccount(account)
    ? (fromAccounts.find((a) => a.id === account.parentId) as Account)
    : null;
}

export function receiveOnAccountLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  accountId: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | null,
    accountAddress: string
  ) => Promise<string>
): Promise<string> {
  tracking.receiveRequested(manifest);

  const account = accounts.find((account) => account.id === accountId);

  if (!account) {
    tracking.receiveFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);
  const accountAddress = accountToWalletAPIAccount(
    account,
    parentAccount ?? undefined //FIXME-STP
  ).address;

  return uiNavigation(account, parentAccount, accountAddress);
}

export function signTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  accountId: string,
  transaction: RawWalletAPITransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | null,
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    }
  ) => Promise<RawWalletAPISignedTransaction>
): Promise<RawWalletAPISignedTransaction> {
  tracking.signTransactionRequested(manifest);

  if (!transaction) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const walletTransaction = deserializeWalletAPITransaction(transaction);
  const account = accounts.find((account) => account.id === accountId);

  if (!account) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  if (
    (isTokenAccount(account)
      ? parentAccount?.currency.family
      : account.currency.family) !== walletTransaction.family
  ) {
    return Promise.reject(
      new Error("Transaction family not matching account currency family")
    );
  }

  const { canEditFees, liveTx, hasFeesProvided } =
    getWalletAPITransactionSignFlowInfos(walletTransaction);

  return uiNavigation(account, parentAccount, {
    canEditFees,
    liveTx,
    hasFeesProvided,
  });
}

export function broadcastTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  accountId: string,
  signedTransaction: RawWalletAPISignedTransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | null,
    signedOperation: SignedOperation
  ) => Promise<string>
): Promise<string> {
  if (!signedTransaction) {
    tracking.broadcastFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const account = accounts.find((account) => account.id === accountId);
  if (!account) {
    tracking.broadcastFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  const signedOperation = deserializeWalletAPISignedTransaction(
    signedTransaction,
    accountId
  );

  return uiNavigation(account, parentAccount, signedOperation);
}

export type CompleteExchangeRequest = {
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  transaction: RawWalletAPITransaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: {
    fromAccount: AccountLike;
    fromParentAccount: Account | null;
    toAccount?: AccountLike;
    toParentAccount: Account | null;
  };
  transaction: TransactionCommon;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export function completeExchangeLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  {
    provider,
    fromAccountId,
    toAccountId,
    transaction,
    binaryPayload,
    signature,
    feesStrategy,
    exchangeType,
  }: CompleteExchangeRequest,
  uiNavigation: (request: CompleteExchangeUiRequest) => Promise<Operation>
): Promise<Operation> {
  tracking.completeExchangeRequested(manifest);

  // Nb get a hold of the actual accounts, and parent accounts
  const fromAccount = accounts.find((a) => a.id === fromAccountId);

  const toAccount = accounts.find((a) => a.id === toAccountId);

  if (!fromAccount) {
    return Promise.reject();
  }

  if (exchangeType === 0x00 && !toAccount) {
    // if we do a swap, a destination account must be provided
    return Promise.reject();
  }

  const fromParentAccount = getParentAccount(fromAccount, accounts);
  const toParentAccount = toAccount
    ? getParentAccount(toAccount, accounts)
    : null;
  const exchange = {
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
  };

  const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);

  if (transaction.family !== mainFromAccount.currency.family) {
    return Promise.reject(
      new Error("Account and transaction must be from the same family")
    );
  }

  const walletTransaction = deserializeWalletAPITransaction(transaction);
  const { liveTx: liveTransaction } =
    getWalletAPITransactionSignFlowInfos(walletTransaction);

  let processedTransaction = accountBridge.createTransaction(mainFromAccount);
  processedTransaction = accountBridge.updateTransaction(
    {
      ...processedTransaction,
      recipient: liveTransaction.recipient,
    },
    {
      ...liveTransaction,
      feesStrategy,
    }
  );

  return uiNavigation({
    provider,
    exchange,
    transaction: processedTransaction,
    binaryPayload,
    signature,
    feesStrategy,
    exchangeType,
  });
}

export function signMessageLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  accountId: string,
  message: string,
  uiNavigation: (
    account: AccountLike,
    message: MessageData | TypedMessageData
  ) => Promise<string>
): Promise<string> {
  tracking.signMessageRequested(manifest);

  const account = accounts.find((account) => account.id === accountId);
  if (account === undefined) {
    tracking.signMessageFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  let formattedMessage: MessageData | TypedMessageData;
  try {
    if (isAccount(account)) {
      formattedMessage = prepareMessageToSign(account, message);
    } else {
      throw new Error("account provided should be the main one");
    }
  } catch (error) {
    tracking.signMessageFail(manifest);
    return Promise.reject(error);
  }

  return uiNavigation(account, formattedMessage);
}
