/* eslint-disable no-console */
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import {
  createAccountNotFound,
  deserializeTransaction,
  ServerError,
} from "@ledgerhq/wallet-api-core";
import {
  getParentAccount,
  getMainAccount,
  makeEmptyTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { AccountLike } from "@ledgerhq/types-live";
import { findTokenById } from "@ledgerhq/cryptoassets";
import {
  ExchangeCompleteParams,
  ExchangeCompleteResult,
  ExchangeStartParams,
  ExchangeStartResult,
  ExchangeType,
} from "@ledgerhq/wallet-api-exchange-module";
import { TrackingAPI } from "./tracking";
import { AppManifest } from "../types";
import {
  getAccountIdFromWalletAccountId,
  getWalletAPITransactionSignFlowInfos,
} from "../converters";
import { getAccountBridge } from "../../bridge";
import { Exchange } from "../../exchange/swap/types";
import { Transaction } from "../../generated/types";

export { ExchangeType };

type Handlers = {
  "custom.exchange.start": RPCHandler<ExchangeStartResult, ExchangeStartParams>;
  "custom.exchange.complete": RPCHandler<ExchangeCompleteResult, ExchangeCompleteParams>;
};

export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
  swapId?: string;
  rate?: number;
  amountExpectedTo?: number;
};

export type ExchangeUiHooks = {
  "custom.exchange.start": (params: {
    exchangeType: ExchangeStartParams["exchangeType"];
    onSuccess: (nonce: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "custom.exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
};

export const handlers = ({
  accounts,
  tracking,
  manifest,
  uiHooks: {
    "custom.exchange.start": uiExchangeStart,
    "custom.exchange.complete": uiExchangeComplete,
  },
}: {
  accounts: AccountLike[];
  tracking: TrackingAPI;
  manifest: AppManifest;
  uiHooks: ExchangeUiHooks;
}) =>
  ({
    "custom.exchange.start": customWrapper<ExchangeStartParams, ExchangeStartResult>(
      async params => {
        tracking.startExchangeRequested(manifest);

        if (!params) {
          tracking.startExchangeNoParams(manifest);
          return { transactionId: "" };
        }

        return new Promise((resolve, reject) =>
          uiExchangeStart({
            exchangeType: params.exchangeType,
            onSuccess: (nonce: string) => {
              tracking.startExchangeSuccess(manifest);
              resolve({ transactionId: nonce });
            },
            onCancel: error => {
              tracking.completeExchangeFail(manifest);
              reject(error);
            },
          }),
        );
      },
    ),
    "custom.exchange.complete": customWrapper<ExchangeCompleteParams, ExchangeCompleteResult>(
      async params => {
        tracking.completeExchangeRequested(manifest);

        if (!params) {
          tracking.completeExchangeNoParams(manifest);
          return { transactionHash: "" };
        }

        const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
        if (!realFromAccountId) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromAccount = accounts.find(acc => acc.id === realFromAccountId);

        if (!fromAccount) {
          throw new ServerError(createAccountNotFound(params.fromAccountId));
        }

        let toAccount;

        if (params.exchangeType === "SWAP" && params.toAccountId) {
          const realToAccountId = getAccountIdFromWalletAccountId(params.toAccountId);
          if (!realToAccountId) {
            return Promise.reject(new Error(`accountId ${params.toAccountId} unknown`));
          }

          toAccount = accounts.find(a => a.id === realToAccountId);

          if (!toAccount) {
            throw new ServerError(createAccountNotFound(params.toAccountId));
          }
        }

        const fromParentAccount = getParentAccount(fromAccount, accounts);
        const toParentAccount = toAccount ? getParentAccount(toAccount, accounts) : undefined;

        const currency = params.tokenCurrency ? findTokenById(params.tokenCurrency) : null;
        const newTokenAccount = currency ? makeEmptyTokenAccount(toAccount, currency) : null;

        const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
        const mainFromAccountFamily = mainFromAccount.currency.family;

        const transaction = deserializeTransaction(params.rawTransaction);

        const { liveTx } = getWalletAPITransactionSignFlowInfos({
          walletApiTransaction: transaction,
          account: mainFromAccount,
        });

        if (liveTx.family !== mainFromAccountFamily) {
          return Promise.reject(
            new Error(
              `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${liveTx.family}`,
            ),
          );
        }

        const accountBridge = getAccountBridge(fromAccount, fromParentAccount);

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
            feesStrategy: params.feeStrategy.toLowerCase(),
            subAccountId,
          },
        );

        return new Promise((resolve, reject) =>
          uiExchangeComplete({
            exchangeParams: {
              exchangeType: ExchangeType[params.exchangeType],
              provider: params.provider,
              transaction: tx,
              signature: Buffer.from(params.hexSignature, "hex").toString(),
              binaryPayload: Buffer.from(params.hexBinaryPayload, "hex").toString(),
              exchange: {
                fromAccount,
                fromParentAccount,
                toAccount: newTokenAccount ? newTokenAccount : toAccount,
                toParentAccount: newTokenAccount ? toAccount : toParentAccount,
              },
              feesStrategy: params.feeStrategy,
              swapId: params.exchangeType === "SWAP" ? params.swapId : undefined,
              rate: params.exchangeType === "SWAP" ? params.rate : undefined,
            },
            onSuccess: (transactionHash: string) => {
              tracking.completeExchangeSuccess(manifest);
              resolve({ transactionHash });
            },
            onCancel: error => {
              tracking.completeExchangeFail(manifest);
              reject(error);
            },
          }),
        );
      },
    ),
  }) as const satisfies Handlers;
