import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";

import {
  accountToWalletAPIAccount,
  getWalletAPITransactionSignFlowInfos,
  getAccountIdFromWalletAccountId,
} from "./converters";
import type { TrackingAPI } from "./tracking";
import { AppManifest, TranslatableString, WalletAPITransaction } from "./types";
import { isTokenAccount, isAccount, getMainAccount } from "../account/index";
import { Transaction } from "../generated/types";
import { MessageData } from "../hw/signMessage/types";
import { prepareMessageToSign } from "../hw/signMessage/index";
import { TypedMessageData } from "../families/ethereum/types";
import { getAccountBridge } from "../bridge";
import { Exchange } from "../exchange/platform/types";

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

  const accountFamily = isTokenAccount(account)
    ? parentAccount?.currency.family
    : account.currency.family;

  if (accountFamily !== transaction.family) {
    return Promise.reject(
      new Error(`Transaction family not matching account currency family. Account family: ${accountFamily}, Transaction family: ${transaction.family}
      `)
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

export const bitcoinFamillyAccountGetXPubLogic = (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string
): Promise<string> => {
  tracking.bitcoinFamillyAccountXpubRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamillyAccountXpubFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find((account) => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamillyAccountXpubFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamillyAccountXpubFail(manifest);
    return Promise.reject(
      new Error("account requested is not a bitcoin family account")
    );
  }

  if (!account.xpub) {
    tracking.bitcoinFamillyAccountXpubFail(manifest);
    return Promise.reject(new Error("account xpub not available"));
  }

  tracking.bitcoinFamillyAccountXpubSuccess(manifest);
  return Promise.resolve(account.xpub);
};

export function startExchangeLogic(
  { manifest, tracking }: WalletAPIContext,
  exchangeType: "SWAP" | "SELL" | "FUND",
  uiNavigation: (exchangeType: "SWAP" | "SELL" | "FUND") => Promise<string>
): Promise<string> {
  tracking.startExchangeRequested(manifest);

  return uiNavigation(exchangeType);
}

export type CompleteExchangeRequest = {
  provider: string;
  fromAccountId: string;
  toAccountId?: string;
  transaction: WalletAPITransaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: Exchange;
  transaction: WalletAPITransaction;
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
  uiNavigation: (request: CompleteExchangeUiRequest) => Promise<string>
): Promise<string> {
  tracking.completeExchangeRequested(manifest);

  const realFromAccountId = getAccountIdFromWalletAccountId(fromAccountId);
  if (!realFromAccountId) {
    return Promise.reject(new Error(`accountId ${fromAccountId} unknown`));
  }

  // Nb get a hold of the actual accounts, and parent accounts
  const fromAccount = accounts.find((a) => a.id === realFromAccountId);

  let toAccount;

  if (toAccountId) {
    const realToAccountId = getAccountIdFromWalletAccountId(toAccountId);
    if (!realToAccountId) {
      return Promise.reject(new Error(`accountId ${toAccountId} unknown`));
    }

    toAccount = accounts.find((a) => a.id === realToAccountId);
  }

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
    : undefined;
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
        `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${transaction.family}`
      )
    );
  }

  const { liveTx } = getWalletAPITransactionSignFlowInfos(transaction);

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
      recipient: liveTx.recipient,
    },
    {
      ...liveTx,
      feesStrategy,
      subAccountId,
    }
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
