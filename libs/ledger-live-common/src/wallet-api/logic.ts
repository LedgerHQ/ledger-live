import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";

import {
  accountToWalletAPIAccount,
  getWalletAPITransactionSignFlowInfos,
  getAccountIdFromWalletAccountId,
} from "./converters";
import type { TrackingAPI } from "./tracking";
import { AppManifest, TranslatableString, WalletAPITransaction } from "./types";
import { isTokenAccount, isAccount } from "../account/index";
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
): Account | undefined {
  return isTokenAccount(account)
    ? (fromAccounts.find((a) => a.id === account.parentId) as Account)
    : undefined;
}

export function receiveOnAccountLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    accountAddress: string
  ) => Promise<string>
): Promise<string> {
  tracking.receiveRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.receiveFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find((account) => account.id === accountId);

  if (!account) {
    tracking.receiveFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);
  const accountAddress = accountToWalletAPIAccount(
    account,
    parentAccount
  ).address;

  return uiNavigation(account, parentAccount, accountAddress);
}

export function signTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  transaction: WalletAPITransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    }
  ) => Promise<SignedOperation>
): Promise<SignedOperation> {
  tracking.signTransactionRequested(manifest);

  if (!transaction) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find((account) => account.id === accountId);

  if (!account) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  if (
    (isTokenAccount(account)
      ? parentAccount?.currency.family
      : account.currency.family) !== transaction.family
  ) {
    return Promise.reject(
      new Error("Transaction family not matching account currency family")
    );
  }

  const { canEditFees, liveTx, hasFeesProvided } =
    getWalletAPITransactionSignFlowInfos(transaction);

  return uiNavigation(account, parentAccount, {
    canEditFees,
    liveTx,
    hasFeesProvided,
  });
}

export function broadcastTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  signedOperation: SignedOperation,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signedOperation: SignedOperation
  ) => Promise<string>
): Promise<string> {
  if (!signedOperation) {
    tracking.broadcastFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.broadcastFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find((account) => account.id === accountId);
  if (!account) {
    tracking.broadcastFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  return uiNavigation(account, parentAccount, signedOperation);
}

export function signMessageLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  message: string,
  uiNavigation: (
    account: AccountLike,
    message: MessageData | TypedMessageData
  ) => Promise<Buffer>
): Promise<Buffer> {
  tracking.signMessageRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signMessageFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

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
