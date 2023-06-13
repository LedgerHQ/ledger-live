import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";

import { accountToPlatformAccount, getPlatformTransactionSignFlowInfos } from "./converters";
import { RawPlatformTransaction, RawPlatformSignedTransaction } from "./rawTypes";
import {
  deserializePlatformTransaction,
  deserializePlatformSignedTransaction,
} from "./serializers";
import type { TrackFunction } from "./tracking";
import { LiveAppManifest, TranslatableString } from "./types";
import { isTokenAccount, getMainAccount, isAccount } from "../account/index";
import { getAccountBridge } from "../bridge/index";
import { Transaction } from "../generated/types";
import { MessageData } from "../hw/signMessage/types";
import { prepareMessageToSign } from "../hw/signMessage/index";
import { TypedMessageData } from "../families/ethereum/types";
import { Exchange } from "../exchange/platform/types";

export function translateContent(content: string | TranslatableString, locale = "en"): string {
  if (!content || typeof content === "string") return content;
  return content[locale] || content.en;
}

export type WebPlatformContext = {
  manifest: LiveAppManifest;
  accounts: AccountLike[];
  tracking: Record<string, TrackFunction>;
};

function getParentAccount(account: AccountLike, fromAccounts: AccountLike[]): Account | undefined {
  return isTokenAccount(account)
    ? (fromAccounts.find(a => a.id === account.parentId) as Account)
    : undefined;
}

export function receiveOnAccountLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
  accountId: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    accountAddress: string,
  ) => Promise<string>,
): Promise<string> {
  tracking.platformReceiveRequested(manifest);

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.platformReceiveFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);
  const accountAddress = accountToPlatformAccount(account, parentAccount).address;

  return uiNavigation(account, parentAccount, accountAddress);
}

export function signTransactionLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
  accountId: string,
  transaction: RawPlatformTransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    },
  ) => Promise<RawPlatformSignedTransaction>,
): Promise<RawPlatformSignedTransaction> {
  tracking.platformSignTransactionRequested(manifest);

  if (!transaction) {
    tracking.platformSignTransactionFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const platformTransaction = deserializePlatformTransaction(transaction);
  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.platformSignTransactionFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  const accountFamily = isTokenAccount(account)
    ? parentAccount?.currency.family
    : account.currency.family;

  if (
    accountFamily !== platformTransaction.family &&
    !(accountFamily === "evm" && transaction.family === "ethereum")
  ) {
    return Promise.reject(
      new Error(`Transaction family not matching account currency family. Account family: ${accountFamily}, Transaction family: ${platformTransaction.family}
      `),
    );
  }

  const { canEditFees, liveTx, hasFeesProvided } =
    getPlatformTransactionSignFlowInfos(platformTransaction);

  return uiNavigation(account, parentAccount, {
    canEditFees,
    liveTx,
    hasFeesProvided,
  });
}

export function broadcastTransactionLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
  accountId: string,
  signedTransaction: RawPlatformSignedTransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signedOperation: SignedOperation,
  ) => Promise<string>,
): Promise<string> {
  if (!signedTransaction) {
    tracking.platformBroadcastFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const account = accounts.find(account => account.id === accountId);
  if (!account) {
    tracking.platformBroadcastFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  const signedOperation = deserializePlatformSignedTransaction(signedTransaction, accountId);

  return uiNavigation(account, parentAccount, signedOperation);
}

export type CompleteExchangeRequest = {
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  transaction: RawPlatformTransaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export function completeExchangeLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
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
  uiNavigation: (request: CompleteExchangeUiRequest) => Promise<Operation>,
): Promise<Operation> {
  tracking.platformCompleteExchangeRequested(manifest);

  // Nb get a hold of the actual accounts, and parent accounts
  const fromAccount = accounts.find(a => a.id === fromAccountId);

  const toAccount = accounts.find(a => a.id === toAccountId);

  if (!fromAccount) {
    return Promise.reject();
  }

  if (exchangeType === 0x00 && !toAccount) {
    // if we do a swap, a destination account must be provided
    return Promise.reject();
  }

  const fromParentAccount = getParentAccount(fromAccount, accounts);
  const toParentAccount = toAccount ? getParentAccount(toAccount, accounts) : undefined;
  const exchange = {
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
  };

  const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
  const mainFromAccountFamily = mainFromAccount.currency.family;

  if (transaction.family !== mainFromAccountFamily) {
    return Promise.reject(
      new Error(
        `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${transaction.family}`,
      ),
    );
  }

  const platformTransaction = deserializePlatformTransaction(transaction);
  const { liveTx: liveTransaction } = getPlatformTransactionSignFlowInfos(platformTransaction);

  /**
   * 'subAccountId' is used for ETH and it's ERC-20 tokens.
   * This field is ignored for BTC
   */
  const subAccountId = fromParentAccount ? fromAccount.id : undefined;

  const bridgeTx = accountBridge.createTransaction(mainFromAccount);
  /**
   * We append the `recipient` to the tx created from `createTransaction`
   * to avoid having userGasLimit reset to null for ETH txs
   * cf. libs/ledger-live-common/src/families/ethereum/updateTransaction.ts
   */
  const tx = accountBridge.updateTransaction(
    {
      ...bridgeTx,
      recipient: liveTransaction.recipient,
    },
    {
      ...liveTransaction,
      feesStrategy,
      subAccountId,
    },
  );

  return uiNavigation({
    provider,
    exchange,
    transaction: tx,
    binaryPayload,
    signature,
    feesStrategy,
    exchangeType,
  });
}

export function signMessageLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
  accountId: string,
  message: string,
  uiNavigation: (account: AccountLike, message: MessageData | TypedMessageData) => Promise<string>,
): Promise<string> {
  tracking.platformSignMessageRequested(manifest);

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.platformSignMessageFail(manifest);
    return Promise.reject(new Error(`account with id "${accountId}" not found`));
  }

  let formattedMessage: MessageData | TypedMessageData;
  try {
    if (isAccount(account)) {
      formattedMessage = prepareMessageToSign(account, message);
    } else {
      throw new Error("account provided should be the main one");
    }
  } catch (error) {
    tracking.platformSignMessageFail(manifest);
    return Promise.reject(error);
  }

  return uiNavigation(account, formattedMessage);
}
