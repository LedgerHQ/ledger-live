import { Dispatch } from "redux";
import { TFunction } from "react-i18next";

import {
  Account,
  CryptoCurrency,
  Operation,
  SignedOperation,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import {
  addPendingOperation,
  getMainAccount,
  isTokenAccount,
} from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import {
  accountToPlatformAccount,
  currencyToPlatformCurrency,
  getPlatformTransactionSignFlowInfos,
} from "@ledgerhq/live-common/lib/platform/converters";
import {
  serializePlatformAccount,
  deserializePlatformTransaction,
  serializePlatformSignedTransaction,
  deserializePlatformSignedTransaction,
} from "@ledgerhq/live-common/lib/platform/serializers";
import { AppManifest } from "@ledgerhq/live-common/lib/platform/types";
import {
  RawPlatformTransaction,
  RawPlatformSignedTransaction,
} from "@ledgerhq/live-common/lib/platform/rawTypes";
import { ToastData } from "@ledgerhq/live-common/lib/notifications/ToastProvider/types";

import { updateAccountWithUpdater } from "../../actions/accounts";
import { openModal } from "../../actions/modals";
import { selectAccountAndCurrency } from "../../drawers/DataSelector/logic";

import * as tracking from "./tracking";

type WebPlatformContext = {
  manifest: AppManifest;
  dispatch: Dispatch;
  accounts: Array<Account>;
};

export const receiveOnAccountCallback = (
  accountId: string,
  { manifest, dispatch, accounts }: WebPlatformContext,
) => {
  tracking.platformReceiveRequested(manifest);

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.platformReceiveFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = isTokenAccount(account)
    ? accounts.find(a => a.id === account.parentId)
    : null;

  // FIXME: handle address rejection (if user reject address, we don't end up in onResult nor in onCancel 🤔)
  return new Promise((resolve, reject) =>
    dispatch(
      openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
        account,
        parentAccount,
        onResult: (account: Account, parentAccount: Account) => {
          tracking.platformReceiveSuccess(manifest);
          resolve(accountToPlatformAccount(account, parentAccount).address);
        },
        onCancel: (error: Error) => {
          tracking.platformReceiveFail(manifest);
          reject(error);
        },
        verifyAddress: true,
      }),
    ),
  );
};

export type RequestAccountParams = {
  currencies?: string[];
  allowAddAccount?: boolean;
  includeTokens?: boolean;
};
export const requestAccountCallback = async (
  { manifest }: Omit<WebPlatformContext, "accounts" | "dispatch">,
  { currencies, allowAddAccount, includeTokens }: RequestAccountParams, // TODO-STP: Check allowAddAccount
) => {
  tracking.platformRequestAccountRequested(manifest);
  const { account, parentAccount } = await selectAccountAndCurrency(currencies, includeTokens);

  return serializePlatformAccount(accountToPlatformAccount(account, parentAccount));
};

export const signTransactionCallback = (
  { manifest, dispatch, accounts }: WebPlatformContext,
  accountId: string,
  transaction: RawPlatformTransaction,
  params: any,
) => {
  tracking.platformSignTransactionRequested(manifest);

  const platformTransaction = deserializePlatformTransaction(transaction);

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.platformSignTransactionFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = isTokenAccount(account)
    ? accounts.find(a => a.id === account.parentId)
    : undefined;

  if (
    (isTokenAccount(account) ? parentAccount?.currency.family : account.currency.family) !==
    platformTransaction.family
  ) {
    throw new Error("Transaction family not matching account currency family");
  }

  const { canEditFees, liveTx, hasFeesProvided } = getPlatformTransactionSignFlowInfos(
    platformTransaction,
  );

  return new Promise((resolve, reject) =>
    dispatch(
      openModal("MODAL_SIGN_TRANSACTION", {
        canEditFees,
        stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
        transactionData: liveTx,
        useApp: params.useApp,
        account,
        parentAccount,
        onResult: (signedOperation: SignedOperation) => {
          tracking.platformSignTransactionSuccess(manifest);
          resolve(serializePlatformSignedTransaction(signedOperation));
        },
        onCancel: (error: Error) => {
          tracking.platformSignTransactionFail(manifest);
          reject(error);
        },
      }),
    ),
  );
};

export const broadcastTransactionCallback = async (
  { manifest, dispatch, accounts }: WebPlatformContext,
  accountId: string,
  signedTransaction: RawPlatformSignedTransaction,
  pushToast: (data: ToastData) => void,
  t: TFunction,
) => {
  const account: Account | undefined = accounts.find(account => account.id === accountId);
  if (!account) {
    tracking.platformBroadcastFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  if (!signedTransaction) {
    tracking.platformBroadcastFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const parentAccount = isTokenAccount(account)
    ? accounts.find(a => a.id === account.parentId)
    : null;

  const signedOperation = deserializePlatformSignedTransaction(signedTransaction, accountId);
  const bridge = getAccountBridge(account, parentAccount);

  let optimisticOperation: Operation = signedOperation.operation;

  // FIXME: couldn't we use `useBroadcast` here?
  if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
    try {
      optimisticOperation = await bridge.broadcast({
        account,
        signedOperation,
      });
      tracking.platformBroadcastSuccess(manifest);
    } catch (error) {
      tracking.platformBroadcastFail(manifest);
      throw error;
    }
  }

  dispatch(
    updateAccountWithUpdater(account.id, account =>
      addPendingOperation(account, optimisticOperation),
    ),
  );

  pushToast({
    id: optimisticOperation.id,
    type: "operation",
    title: t("platform.flows.broadcast.toast.title"),
    text: t("platform.flows.broadcast.toast.text"),
    icon: "info",
    callback: () => {
      tracking.platformBroadcastOperationDetailsClick(manifest);
      dispatch(
        openModal("MODAL_OPERATION_DETAILS", {
          operationId: optimisticOperation.id,
          accountId: account.id,
          parentId: null,
        }),
      );
    },
  });

  return optimisticOperation.hash;
};

export const startExchangeCallback = (
  { manifest, dispatch }: Omit<WebPlatformContext, "accounts">,
  exchangeType: number,
) => {
  tracking.platformStartExchangeRequested(manifest);

  return new Promise((resolve, reject) =>
    dispatch(
      openModal("MODAL_PLATFORM_EXCHANGE_START", {
        exchangeType,
        onResult: (nonce: string) => {
          tracking.platformStartExchangeSuccess(manifest);
          resolve(nonce);
        },
        onCancel: (error: Error) => {
          tracking.platformStartExchangeFail(manifest);
          reject(error);
        },
      }),
    ),
  );
};

export type CompleteExchangeRequest = {
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
};
export const completeExchangeCallback = (
  { manifest, dispatch, accounts }: WebPlatformContext,
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
) => {
  // Nb get a hold of the actual accounts, and parent accounts
  const fromAccount = accounts.find(a => a.id === fromAccountId);

  const toAccount = accounts.find(a => a.id === toAccountId);

  if (!fromAccount) {
    return null;
  }

  if (exchangeType === 0x00 && !toAccount) {
    // if we do a swap, a destination account must be provided
    return null;
  }

  let fromParentAccount: Account | undefined;
  if (isTokenAccount(fromAccount)) {
    fromParentAccount = accounts.find(a => a.id === fromAccount.parentId);
  }
  let toParentAccount: Account | undefined;
  if (toAccount && isTokenAccount(toAccount)) {
    toParentAccount = accounts.find(a => a.id === toAccount.parentId);
  }

  const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);

  transaction.family = mainFromAccount.currency.family;

  const platformTransaction = deserializePlatformTransaction(transaction);

  platformTransaction.feesStrategy = feesStrategy;

  let processedTransaction = accountBridge.createTransaction(mainFromAccount);
  processedTransaction = accountBridge.updateTransaction(processedTransaction, platformTransaction);

  tracking.platformCompleteExchangeRequested(manifest);
  return new Promise((resolve, reject) =>
    dispatch(
      openModal("MODAL_PLATFORM_EXCHANGE_COMPLETE", {
        provider,
        exchange: {
          fromAccount,
          fromParentAccount,
          toAccount,
          toParentAccount,
        },
        transaction: processedTransaction,
        binaryPayload,
        signature,
        feesStrategy,
        exchangeType,

        onResult: (operation: Operation) => {
          tracking.platformCompleteExchangeSuccess(manifest);
          resolve(operation);
        },
        onCancel: (error: Error) => {
          tracking.platformCompleteExchangeFail(manifest);
          reject(error);
        },
      }),
    ),
  );
};
