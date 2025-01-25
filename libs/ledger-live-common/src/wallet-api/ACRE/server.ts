/* eslint-disable no-console */
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import { deserializeTransaction } from "@ledgerhq/wallet-api-core";
import {
  getParentAccount,
  getMainAccount,
  makeEmptyTokenAccount,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import { findTokenById } from "@ledgerhq/cryptoassets";
import {
  MessageSignParams,
  MessageSignResult,
  SignOptions,
  TransactionOptions,
  TransactionSignAndBroadcastParams,
  TransactionSignAndBroadcastResult,
  TransactionSignParams,
  TransactionSignResult,
} from "@ledgerhq/wallet-api-acre-module";
import { TrackingAPI } from "./tracking";
import { AppManifest } from "../types";
import {
  getAccountIdFromWalletAccountId,
  getWalletAPITransactionSignFlowInfos,
} from "../converters";
import { getAccountBridge } from "../../bridge";
import { Transaction } from "../../generated/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";

type Handlers = {
  "custom.acre.messageSign": RPCHandler<MessageSignResult, MessageSignParams>;
  "custom.acre.transactionSign": RPCHandler<TransactionSignResult, TransactionSignParams>;
  "custom.acre.transactionSignAndBroadcast": RPCHandler<
    TransactionSignAndBroadcastResult,
    TransactionSignAndBroadcastParams
  >;
};

type ACREUiHooks = {
  "custom.acre.messageSign": (params: {
    account: AccountLike;
    message: AnyMessage;
    options?: SignOptions;
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "custom.acre.transactionSign": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    };
    options?: TransactionOptions;
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "custom.acre.transactionBroadcast"?: (
    account: AccountLike,
    parentAccount: Account | undefined,
    mainAccount: Account,
    optimisticOperation: Operation,
  ) => void;
};

export const handlers = ({
  accounts,
  tracking,
  manifest,
  uiHooks: {
    "custom.acre.messageSign": uiMessageSign,
    "custom.acre.transactionSign": uiTransactionSign,
    "custom.acre.transactionBroadcast": uiTransactionBroadcast,
  },
}: {
  accounts: AccountLike[];
  tracking: TrackingAPI;
  manifest: AppManifest;
  uiHooks: ACREUiHooks;
}) => {
  function signTransaction({
    accountId: walletAccountId,
    rawTransaction,
    options,
    tokenCurrency,
  }: TransactionSignParams) {
    const transaction = deserializeTransaction(rawTransaction);

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

    const account = accounts.find(account => account.id === accountId);

    if (!account) {
      tracking.signTransactionFail(manifest);
      return Promise.reject(new Error("Account required"));
    }

    const parentAccount = getParentAccount(account, accounts);

    const accountFamily = isTokenAccount(account)
      ? parentAccount?.currency.family
      : account.currency.family;

    const mainAccount = getMainAccount(account, parentAccount);
    const currency = tokenCurrency ? findTokenById(tokenCurrency) : null;
    const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

    const { canEditFees, liveTx, hasFeesProvided } = getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: transaction,
      account: mainAccount,
    });

    if (accountFamily !== liveTx.family) {
      return Promise.reject(
        new Error(
          `Account and transaction must be from the same family. Account family: ${accountFamily}, Transaction family: ${liveTx.family}`,
        ),
      );
    }

    const signFlowInfos = {
      canEditFees,
      liveTx,
      hasFeesProvided,
    };

    return new Promise<SignedOperation>((resolve, reject) => {
      let done = false;
      return uiTransactionSign({
        account: signerAccount,
        parentAccount,
        signFlowInfos,
        options,
        onSuccess: signedOperation => {
          if (done) return;
          done = true;
          tracking.signTransactionSuccess(manifest);
          resolve(signedOperation);
        },
        onError: error => {
          if (done) return;
          done = true;
          tracking.signTransactionFail(manifest);
          reject(error);
        },
      });
    });
  }

  return {
    "custom.acre.messageSign": customWrapper<MessageSignParams, MessageSignResult>(async params => {
      if (!params) {
        tracking.signMessageNoParams(manifest);
        // Maybe return an error instead
        return { hexSignedMessage: "" };
      }

      tracking.signMessageRequested(manifest);

      const { accountId: walletAccountId, derivationPath, message, options } = params;

      const accountId = getAccountIdFromWalletAccountId(walletAccountId);
      if (!accountId) {
        tracking.signMessageFail(manifest);
        return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
      }

      const account = accounts.find(account => account.id === accountId);
      if (account === undefined) {
        tracking.signMessageFail(manifest);
        return Promise.reject(new Error("account not found"));
      }

      const path = fromRelativePath(getMainAccount(account).freshAddressPath, derivationPath);

      const formattedMessage = { ...message, path } as AnyMessage;

      return new Promise((resolve, reject) => {
        let done = false;
        return uiMessageSign({
          account,
          message: formattedMessage,
          options,
          onSuccess: signature => {
            if (done) return;
            done = true;
            tracking.signMessageSuccess(manifest);
            resolve({
              hexSignedMessage: signature.replace("0x", ""),
            });
          },
          onCancel: () => {
            if (done) return;
            done = true;
            tracking.signMessageFail(manifest);
            reject(new UserRefusedOnDevice());
          },
          onError: error => {
            if (done) return;
            done = true;
            tracking.signMessageFail(manifest);
            reject(error);
          },
        });
      });
    }),
    "custom.acre.transactionSign": customWrapper<TransactionSignParams, TransactionSignResult>(
      async params => {
        if (!params) {
          tracking.signTransactionNoParams(manifest);
          // Maybe return an error instead
          return { signedTransactionHex: "" };
        }

        const signedOperation = await signTransaction(params);

        return {
          signedTransactionHex: Buffer.from(signedOperation.signature).toString("hex"),
        };
      },
    ),
    "custom.acre.transactionSignAndBroadcast": customWrapper<
      TransactionSignAndBroadcastParams,
      TransactionSignAndBroadcastResult
    >(async params => {
      if (!params) {
        tracking.signTransactionAndBroadcastNoParams(manifest);
        // Maybe return an error instead
        return { transactionHash: "" };
      }

      const signedOperation = await signTransaction(params);

      if (!signedOperation) {
        tracking.broadcastFail(manifest);
        return Promise.reject(new Error("Transaction required"));
      }

      const { accountId: walletAccountId, tokenCurrency } = params;

      const accountId = getAccountIdFromWalletAccountId(walletAccountId);
      if (!accountId) {
        tracking.broadcastFail(manifest);
        return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
      }

      const account = accounts.find(account => account.id === accountId);
      if (!account) {
        tracking.broadcastFail(manifest);
        return Promise.reject(new Error("Account required"));
      }

      const currency = tokenCurrency ? findTokenById(tokenCurrency) : null;
      const parentAccount = getParentAccount(account, accounts);
      const mainAccount = getMainAccount(account, parentAccount);
      const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

      const bridge = getAccountBridge(signerAccount, parentAccount);
      const broadcastAccount = getMainAccount(signerAccount, parentAccount);

      let optimisticOperation: Operation = signedOperation.operation;

      if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        try {
          optimisticOperation = await bridge.broadcast({
            account: broadcastAccount,
            signedOperation,
          });
          tracking.broadcastSuccess(manifest);
        } catch (error) {
          tracking.broadcastFail(manifest);
          throw error;
        }
      }

      uiTransactionBroadcast &&
        uiTransactionBroadcast(account, parentAccount, mainAccount, optimisticOperation);

      return {
        transactionHash: optimisticOperation.hash,
      };
    }),
  } as const satisfies Handlers;
};

function fromRelativePath(basePath: string, derivationPath?: string) {
  if (!derivationPath) {
    return basePath;
  }
  const splitPath = basePath.split("'/");
  splitPath[splitPath.length - 1] = derivationPath;
  return splitPath.join("'/");
}
