import { Account, AccountLike, Operation, TransactionCommon } from "@ledgerhq/types-live";

import { AppManifest } from "./types";
import { isTokenAccount, getMainAccount } from "../account/index";
import { getAccountBridge } from "../bridge/index";
import {
  accountToPlatformAccount,
  getPlatformTransactionSignFlowInfos,
} from "./converters";
import {
  serializePlatformAccount,
  deserializePlatformTransaction,
  serializePlatformSignedTransaction,
  deserializePlatformSignedTransaction,
} from "./serializers";
import {
  RawPlatformTransaction,
  RawPlatformSignedTransaction,
} from "./rawTypes";
import { Transaction } from "../generated/types";

export function translateContent(content: any, locale = "en"): string {
  if (!content || typeof content !== "object") return content;
  return content[locale] || content.en;
}

type TrackPlatform = (manifest: AppManifest) => void;

type WebPlatformContext = {
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: Record<string, TrackPlatform>; // TODO-STP: should not be necessary when putting in common tracking (other PR)
};

function getParentAccount(
  account: AccountLike,
  fromAccounts: AccountLike[]
): Account | null {
  return isTokenAccount(account)
    ? (fromAccounts.find((a) => a.id === account.parentId) as Account)
    : null;
}

export function receiveOnAccountCommonLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
  accountId: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | null
  ) => Promise<string>
): Promise<string> {
  tracking.platformReceiveRequested(manifest);

  const account = accounts.find((account) => account.id === accountId);

  if (!account) {
    tracking.platformReceiveFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  return uiNavigation(account, parentAccount);
}

export function signTransactionCommonLogic(
  { manifest, accounts, tracking }: WebPlatformContext,
  accountId: string,
  transaction: RawPlatformTransaction,
  params: {
    /**
     * The name of the Ledger Nano app to use for the signing process
     */
    useApp: string;
  },
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | null,
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    }
  ) => Promise<RawPlatformSignedTransaction>
): Promise<RawPlatformSignedTransaction> {
  tracking.platformSignTransactionRequested(manifest);

  if (!transaction) {
    tracking.platformSignTransactionFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const platformTransaction = deserializePlatformTransaction(transaction);
  const account = accounts.find((account) => account.id === accountId);

  if (!account) {
    tracking.platformSignTransactionFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  if (
    (isTokenAccount(account)
      ? parentAccount?.currency.family
      : account.currency.family) !== platformTransaction.family
  ) {
    return Promise.reject(
      new Error("Transaction family not matching account currency family")
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
  fromAccount: AccountLike;
  fromParentAccount: Account | null;
  toAccount?: AccountLike;
  toParentAccount: Account | null;
  transaction: TransactionCommon;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export function completeExchangeCommonLogic(
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
  uiNavigation: (request: CompleteExchangeUiRequest) => Promise<Operation>
): Promise<Operation> {
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

  const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);

  transaction.family = mainFromAccount.currency.family;

  const platformTransaction = deserializePlatformTransaction(transaction);

  platformTransaction.feesStrategy = feesStrategy;

  let processedTransaction = accountBridge.createTransaction(mainFromAccount);
  processedTransaction = accountBridge.updateTransaction(
    processedTransaction,
    platformTransaction
  );

  tracking.platformCompleteExchangeRequested(manifest);
  return uiNavigation({
    provider,
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
    transaction: processedTransaction,
    binaryPayload,
    signature,
    feesStrategy,
    exchangeType,
  });
}
