/* eslint-disable no-console */
import {
  getMainAccount,
  getParentAccount,
  makeEmptyTokenAccount,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { decodeSwapPayload } from "@ledgerhq/hw-app-exchange";
import { AccountLike, getCurrencyForAccount, TokenAccount } from "@ledgerhq/types-live";
import {
  createAccountNotFound,
  createCurrencyNotFound,
  createUnknownError,
  deserializeTransaction,
  ServerError,
} from "@ledgerhq/wallet-api-core";
import {
  ExchangeCompleteParams,
  ExchangeCompleteResult,
  ExchangeStartParams,
  ExchangeStartResult,
  ExchangeStartSellParams,
  ExchangeStartSwapParams,
  ExchangeStartFundParams,
  ExchangeSwapParams,
  ExchangeType,
  SwapLiveError,
  SwapResult,
  type GetQuotesResponse,
  type GetQuotesWireArgs,
} from "@ledgerhq/wallet-api-exchange-module";
import { customWrapper, RPCHandler } from "@ledgerhq/wallet-api-server";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "../../bridge";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import { FeatureFlags } from "../../exchange/swap/types";
import { Exchange } from "../../exchange/types";
import {
  getAccountIdFromWalletAccountId,
  getWalletAPITransactionSignFlowInfos,
} from "../converters";
import { AppManifest } from "../types";
import {
  createAccounIdNotFound,
  createWrongSellParams,
  createWrongFundParams,
  ExchangeError,
} from "./error";
import { executeSwap, extractSwapStartParam } from "./executeSwap";
import { TrackingAPI } from "./tracking";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getQuotes } from "./quotes";
import { resolveQuotesInput } from "./quotes/resolveQuotesInput";
import { fetchSpotPrices } from "./quotes/service/fetchSpotPrices";
import {
  getTransactionStatus,
  type GetTransactionStatusResponse,
  type GetTransactionStatusWireArgs,
} from "./transactionStatus";
import type { ExchangeStartParamsUiRequest, ExchangeUiHooks } from "./uiRequests";

export { ExchangeType };

type Handlers = {
  "custom.exchange.start": RPCHandler<
    ExchangeStartResult,
    ExchangeStartParams | ExchangeStartSwapParams | ExchangeStartSellParams
  >;
  "custom.exchange.complete": RPCHandler<ExchangeCompleteResult, ExchangeCompleteParams>;
  "custom.exchange.error": RPCHandler<void, SwapLiveError>;
  "custom.isReady": RPCHandler<void, void>;
  "custom.exchange.swap": RPCHandler<SwapResult, ExchangeSwapParams>;
  "custom.exchange.getQuotes": RPCHandler<GetQuotesResponse, GetQuotesWireArgs>;
  "custom.exchange.getTransactionStatus": RPCHandler<
    GetTransactionStatusResponse,
    GetTransactionStatusWireArgs
  >;
};

export type { CompleteExchangeUiRequest, SwapUiRequest } from "./uiRequests";

/**
 * Build the wallet-api exchange handlers for a given wallet instance.
 *
 * The factory captures the per-session wallet state (`accounts`, tracking
 * sink, locale, counter-value) and returns the RPC handlers used by the
 * wallet-api server. Locale and counter-value are threaded into
 * `custom.exchange.getQuotes` so quotes can carry fully formatted values
 * without the caller having to pass them on the wire.
 *
 * @param deps - Per-session wallet state and UI hooks.
 * @param deps.accounts - Wallet accounts, used to resolve account ids and
 *   build formatting context for quotes.
 * @param deps.tracking - Analytics sink for the Exchange flow.
 * @param deps.manifest - Live-app manifest initiating the exchange.
 * @param deps.flags - Optional feature flags (e.g. `wallet40Ux`).
 * @param deps.locale - BCP 47 tag (e.g. `"en-US"`) used to format numbers
 *   on `Quote.formatted`. Sourced from the wallet's i18n selector.
 * @param deps.counterValueCurrency - Fiat ticker (e.g. `"USD"`) used for
 *   countervalue strings on `Quote.formatted` and to price spot values
 *   for the unrealistic-quote warning. Sourced from the wallet's
 *   counter-value setting.
 * @param deps.deviceModelId - Optional last-seen device model id, used for
 *   device-specific quote warnings.
 * @param deps.uiHooks - Host-specific callbacks that drive the
 *   device / drawer flows.
 * @returns The wallet-api `Handlers` map for the Exchange module.
 */
export const handlers = ({
  accounts,
  tracking,
  manifest,
  flags,
  getFeature,
  locale,
  counterValueCurrency,
  deviceModelId,
  uiHooks: {
    "custom.exchange.start": uiExchangeStart,
    "custom.exchange.complete": uiExchangeComplete,
    "custom.exchange.error": uiError,
    "custom.isReady": uiIsReady,
    "custom.exchange.swap": uiSwap,
  },
}: {
  accounts: AccountLike[];
  tracking: TrackingAPI;
  manifest: AppManifest;
  flags?: FeatureFlags;
  getFeature?: GetFeatureFn;
  locale: string;
  counterValueCurrency: string;
  deviceModelId?: DeviceModelId;
  uiHooks: ExchangeUiHooks;
}) =>
  ({
    "custom.exchange.start": customWrapper<ExchangeStartParams, ExchangeStartResult>(
      async params => {
        if (!params) {
          tracking.startExchangeNoParams(manifest);
          return { transactionId: "" };
        }

        const trackingParams = {
          provider: params.provider,
          exchangeType: params.exchangeType,
          isEmbeddedSwap: params.exchangeType === "SWAP" ? params.isEmbedded : undefined,
          swapEntryPoint: params.exchangeType === "SWAP" ? params.swapEntryPoint : undefined,
        };

        tracking.startExchangeRequested(trackingParams);

        let exchangeParams: ExchangeStartParamsUiRequest;

        // Use `if else` instead of switch to leverage TS type narrowing and avoid `params` force cast.
        if (params.exchangeType == "SWAP") {
          exchangeParams = await extractSwapStartParam(params, accounts);
        } else if (params.exchangeType == "SELL") {
          exchangeParams = extractSellStartParam(params, accounts);
        } else {
          exchangeParams = extractFundStartParam(params, accounts);
        }

        return new Promise((resolve, reject) =>
          uiExchangeStart({
            exchangeParams,
            onSuccess: (nonce: string, device) => {
              tracking.startExchangeSuccess(trackingParams);
              resolve({ transactionId: nonce, device });
            },
            onCancel: error => {
              tracking.startExchangeFail(trackingParams);
              reject(error);
            },
          }),
        );
      },
    ),
    "custom.exchange.complete": customWrapper<ExchangeCompleteParams, ExchangeCompleteResult>(
      async params => {
        if (!params) {
          tracking.completeExchangeNoParams(manifest);
          return { transactionHash: "" };
        }
        const trackingParams = {
          provider: params.provider,
          exchangeType: params.exchangeType,
          isEmbeddedSwap: params.exchangeType === "SWAP" ? params.isEmbedded : undefined,
          swapEntryPoint: params.exchangeType === "SWAP" ? params.swapEntryPoint : undefined,
        };
        tracking.completeExchangeRequested(trackingParams);

        const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
        if (!realFromAccountId) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromAccount = accounts.find(acc => acc.id === realFromAccountId);

        if (!fromAccount) {
          throw new ServerError(createAccountNotFound(params.fromAccountId));
        }

        const fromParentAccount = getParentAccount(fromAccount, accounts);

        let exchange: Exchange;

        if (params.exchangeType === "SWAP") {
          const realToAccountId = getAccountIdFromWalletAccountId(params.toAccountId);
          if (!realToAccountId) {
            return Promise.reject(new Error(`accountId ${params.toAccountId} unknown`));
          }

          const toAccount = accounts.find(a => a.id === realToAccountId);

          if (!toAccount) {
            throw new ServerError(createAccountNotFound(params.toAccountId));
          }

          // TODO: check logic for EmptyTokenAccount
          let toParentAccount = getParentAccount(toAccount, accounts);
          let newTokenAccount: TokenAccount | undefined;
          if (params.tokenCurrency) {
            const currency = await getCryptoAssetsStore().findTokenById(params.tokenCurrency);
            if (!currency) {
              throw new ServerError(createCurrencyNotFound(params.tokenCurrency));
            }
            if (toAccount.type === "Account") {
              newTokenAccount = makeEmptyTokenAccount(toAccount, currency);
              toParentAccount = toAccount;
            } else {
              newTokenAccount = makeEmptyTokenAccount(toParentAccount, currency);
            }
          }

          const toCurrency = await getToCurrency(
            params.hexBinaryPayload,
            toAccount,
            newTokenAccount,
          );

          exchange = {
            fromAccount,
            fromParentAccount,
            fromCurrency: getCurrencyForAccount(fromAccount),
            toAccount: newTokenAccount ? newTokenAccount : toAccount,
            toParentAccount,
            toCurrency,
          };
        } else {
          exchange = {
            fromAccount,
            fromParentAccount,
            fromCurrency: getCurrencyForAccount(fromAccount),
          };
        }

        const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
        const mainFromAccountFamily = mainFromAccount.currency.family;

        const transaction = deserializeTransaction(params.rawTransaction);

        const { liveTx } = await getWalletAPITransactionSignFlowInfos({
          walletApiTransaction: transaction,
          account: fromAccount,
        });

        if (liveTx.family !== mainFromAccountFamily) {
          return Promise.reject(
            new Error(
              `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${liveTx.family}`,
            ),
          );
        }

        const accountBridge = await getAccountBridge(fromAccount, fromParentAccount);

        /**
         * 'subAccountId' is used for ETH and it's ERC-20 tokens.
         * This field is ignored for BTC
         */
        const subAccountId =
          fromParentAccount && fromParentAccount.id !== fromAccount.id ? fromAccount.id : undefined;

        const bridgeTx = accountBridge.createTransaction(fromAccount);
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

        let amountExpectedTo;
        let magnitudeAwareRate;
        let refundAddress;
        let payoutAddress;
        if (params.exchangeType === "SWAP") {
          // Get amountExpectedTo and magnitudeAwareRate from binary payload
          const decodePayload = await decodeSwapPayload(params.hexBinaryPayload);
          amountExpectedTo = new BigNumber(decodePayload.amountToWallet.toString());
          magnitudeAwareRate = tx.amount && amountExpectedTo.dividedBy(tx.amount);
          refundAddress = decodePayload.refundAddress;
          payoutAddress = decodePayload.payoutAddress;
        }

        return new Promise((resolve, reject) =>
          uiExchangeComplete({
            exchangeParams: {
              exchangeType: ExchangeType[params.exchangeType],
              provider: params.provider,
              transaction: tx,
              signature: params.hexSignature,
              binaryPayload: params.hexBinaryPayload,
              exchange,
              feesStrategy: params.feeStrategy,
              swapId: params.exchangeType === "SWAP" ? params.swapId : undefined,
              amountExpectedTo,
              magnitudeAwareRate,
              refundAddress,
              payoutAddress,
              isEmbeddedSwap: params.exchangeType === "SWAP" ? params.isEmbedded : undefined,
              swapEntryPoint: params.exchangeType === "SWAP" ? params.swapEntryPoint : undefined,
            },
            onSuccess: (transactionHash: string) => {
              tracking.completeExchangeSuccess({
                ...trackingParams,
                currency: params.rawTransaction.family,
              });
              resolve({ transactionHash });
            },
            onCancel: error => {
              tracking.completeExchangeFail(trackingParams);
              reject(error);
            },
          }),
        );
      },
    ),
    "custom.exchange.error": customWrapper<SwapLiveError, void>(async params => {
      return new Promise((resolve, reject) =>
        uiError({
          error: params,
          onSuccess: () => {
            resolve();
          },
          onCancel: () => {
            reject();
          },
        }),
      );
    }),
    "custom.exchange.swap": customWrapper<ExchangeSwapParams, SwapResult>(async params => {
      if (!params) {
        tracking.startExchangeNoParams(manifest);
        throw new ServerError(createUnknownError({ message: "params is undefined" }));
      }

      return executeSwap(
        {
          accounts,
          tracking,
          flags,
          getFeature,
          uiHooks: {
            "custom.exchange.start": uiExchangeStart,
            "custom.exchange.swap": uiSwap,
            "custom.exchange.error": uiError,
          },
        },
        params,
      );
    }),

    "custom.isReady": customWrapper<void, void>(async () => {
      return new Promise((resolve, reject) =>
        uiIsReady({
          onSuccess: () => {
            resolve();
          },
          onCancel: () => {
            reject();
          },
        }),
      );
    }),

    "custom.exchange.getQuotes": customWrapper<GetQuotesWireArgs, GetQuotesResponse>(
      async params => {
        if (!params) {
          throw new ServerError(createUnknownError({ message: "params is undefined" }));
        }
        const quotesInput = resolveQuotesInput(params.data, accounts);
        // Fetch spot prices for the resolved currency ids that matter for
        // quote warnings. `fetchSpotPrices` never throws: on any failure it
        // returns `{}` and the warning check short-circuits.
        const spotPrices = await fetchSpotPrices({
          currencyIds: quotesInput
            ? [
                quotesInput.sendCurrencyId,
                quotesInput.receiveCurrencyId,
                quotesInput.networkFeesCurrencyId,
              ]
            : [],
          counterValue: counterValueCurrency,
        });
        return getQuotes(params, {
          accounts,
          spotPrices,
          locale,
          counterValueCurrency,
          deviceModelId,
        });
      },
    ),

    "custom.exchange.getTransactionStatus": customWrapper<
      GetTransactionStatusWireArgs,
      GetTransactionStatusResponse
    >(async params => {
      if (!params) {
        throw new ServerError(createUnknownError({ message: "params is undefined" }));
      }
      return getTransactionStatus(params, { accounts });
    }),
  }) as const satisfies Handlers;

function extractSellStartParam(
  params: ExchangeStartSellParams,
  accounts: AccountLike[],
): ExchangeStartParamsUiRequest {
  if (!("provider" in params)) {
    throw new ExchangeError(createWrongSellParams(params));
  }

  if (!params.fromAccountId) {
    return {
      exchangeType: params.exchangeType,
      provider: params.provider,
    } as ExchangeStartParamsUiRequest;
  }

  const realFromAccountId = getAccountIdFromWalletAccountId(params?.fromAccountId);

  if (!realFromAccountId) {
    throw new ExchangeError(createAccounIdNotFound(params.fromAccountId));
  }

  const fromAccount = accounts?.find(acc => acc.id === realFromAccountId);

  if (!fromAccount) {
    throw new ServerError(createAccountNotFound(params.fromAccountId));
  }

  const fromParentAccount = getParentAccount(fromAccount, accounts);

  return {
    exchangeType: params.exchangeType,
    provider: params.provider,
    exchange: {
      fromAccount,
      fromParentAccount,
    },
  };
}

function extractFundStartParam(
  params: ExchangeStartFundParams,
  accounts: AccountLike[],
): ExchangeStartParamsUiRequest {
  if (!("provider" in params)) {
    throw new ExchangeError(createWrongFundParams(params));
  }

  if (!params.fromAccountId) {
    return {
      exchangeType: params.exchangeType,
      provider: params.provider,
    } as ExchangeStartParamsUiRequest;
  }

  const realFromAccountId = getAccountIdFromWalletAccountId(params?.fromAccountId);

  if (!realFromAccountId) {
    throw new ExchangeError(createAccounIdNotFound(params.fromAccountId));
  }

  const fromAccount = accounts?.find(acc => acc.id === realFromAccountId);

  if (!fromAccount) {
    throw new ServerError(createAccountNotFound(params.fromAccountId));
  }

  const fromParentAccount = getParentAccount(fromAccount, accounts);

  return {
    exchangeType: params.exchangeType,
    provider: params.provider,
    exchange: {
      fromAccount,
      fromParentAccount,
    },
  };
}

async function getToCurrency(
  binaryPayload: string,
  toAccount: AccountLike,
  newTokenAccount?: TokenAccount,
): Promise<CryptoOrTokenCurrency> {
  const { payoutAddress: tokenAddress, currencyTo } = await decodeSwapPayload(binaryPayload);

  // In case of an SPL Token recipient and no TokenAccount exists.
  if (
    toAccount.type !== "TokenAccount" && // it must not be a SPL Token
    toAccount.currency.id === "solana" && // the target account must be a SOL Account
    tokenAddress !== toAccount.freshAddress
  ) {
    // tokenAddress is the SPL token mint address for Solana tokens
    const splTokenCurrency = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      tokenAddress,
      "solana",
    );
    if (splTokenCurrency && splTokenCurrency.ticker === currencyTo) return splTokenCurrency;
  }

  return newTokenAccount?.token ?? getCurrencyForAccount(toAccount);
}
