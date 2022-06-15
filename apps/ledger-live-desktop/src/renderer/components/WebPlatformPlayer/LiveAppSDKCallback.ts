import { Dispatch } from "redux";
import { TFunction } from "react-i18next";

import {
  Account,
  CryptoCurrency,
  Operation,
  SignedOperation,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/lib/account";
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

import * as tracking from "./tracking";

type WebPlatformContext = {
  manifest: AppManifest;
  dispatch: Dispatch;
  accounts: Array<Account>;
};

export const listAccountsCallback = (accounts: Array<Account>) =>
  accounts.map(account => serializePlatformAccount(accountToPlatformAccount(account)));

export const listCurrenciesCallback = (currencies: Array<CryptoCurrency>) =>
  currencies.map(currencyToPlatformCurrency);

export const receiveOnAccountCallback = (
  accountId: string,
  { manifest, dispatch, accounts }: WebPlatformContext,
) => {
  const account = accounts.find(account => account.id === accountId);

  tracking.platformReceiveRequested(manifest);

  // FIXME: handle address rejection (if user reject address, we don't end up in onResult nor in onCancel 🤔)
  return new Promise((resolve, reject) =>
    dispatch(
      openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
        account,
        parentAccount: null,
        onResult: (account: Account) => {
          tracking.platformReceiveSuccess(manifest);
          resolve(account.freshAddress);
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
};
export const requestAccountCallback = (
  { manifest, dispatch }: Omit<WebPlatformContext, "accounts">,
  { currencies, allowAddAccount }: RequestAccountParams,
) => {
  tracking.platformRequestAccountRequested(manifest);
  return new Promise((resolve, reject) =>
    dispatch(
      openModal("MODAL_REQUEST_ACCOUNT", {
        currencies,
        allowAddAccount,
        onResult: (account: Account) => {
          tracking.platformRequestAccountSuccess(manifest);
          /**
           * If account does not exist, it means one (or multiple) account(s) have been created
           * In this case, to notify the user of the API that an account has been created,
           * and that he should refetch the accounts list, we return an empty object
           * (that will be deserialized as an empty Account object in the SDK)
           *
           * FIXME: this overall handling of created accounts could be improved and might not handle "onCancel"
           */
          //
          resolve(account ? serializePlatformAccount(accountToPlatformAccount(account)) : {});
        },
        onCancel: (error: Error) => {
          tracking.platformRequestAccountFail(manifest);
          reject(error);
        },
      }),
    ),
  );
};

export const signTransactionCallback = (
  { manifest, dispatch, accounts }: WebPlatformContext,
  accountId: string,
  transaction: RawPlatformTransaction,
  params: any,
) => {
  const platformTransaction = deserializePlatformTransaction(transaction);

  const account = accounts.find(account => account.id === accountId);

  if (!account) return null;

  if (account.currency.family !== platformTransaction.family) {
    throw new Error("Transaction family not matching account currency family");
  }

  tracking.platformSignTransactionRequested(manifest);

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
        parentAccount: null,
        onResult: (signedOperation: SignedOperation) => {
          tracking.platformSignTransactionRequested(manifest);
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
  if (!account) return null;

  const signedOperation = deserializePlatformSignedTransaction(signedTransaction, accountId);
  const bridge = getAccountBridge(account);

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
  if (fromAccount.type === "TokenAccount") {
    fromParentAccount = accounts.find(a => a.id === fromAccount.parentId);
  }
  let toParentAccount: Account | undefined;
  if (toAccount && toAccount.type === "TokenAccount") {
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
