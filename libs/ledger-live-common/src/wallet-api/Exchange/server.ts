/* eslint-disable no-console */
import {
  getMainAccount,
  getParentAccount,
  makeEmptyTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { findTokenById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { decodeSwapPayload } from "@ledgerhq/hw-app-exchange";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, getCurrencyForAccount, TokenAccount } from "@ledgerhq/types-live";
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
  ExchangeSwapParams,
  ExchangeType,
  SwapLiveError,
  SwapResult,
} from "@ledgerhq/wallet-api-exchange-module";
import { customWrapper, RPCHandler } from "@ledgerhq/wallet-api-server";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "../../bridge";
import { retrieveSwapPayload } from "../../exchange/swap/api/v5/actions";
import { transactionStrategy } from "../../exchange/swap/transactionStrategies";
import { ExchangeSwap } from "../../exchange/swap/types";
import { Exchange } from "../../exchange/types";
import { Transaction } from "../../generated/types";
import {
  getAccountIdFromWalletAccountId,
  getWalletAPITransactionSignFlowInfos,
} from "../converters";
import { AppManifest } from "../types";
import {
  createAccounIdNotFound,
  createWrongSellParams,
  createWrongSwapParams,
  ExchangeError,
} from "./error";
import { TrackingAPI } from "./tracking";
import { getSwapStepFromError } from "../../exchange/error";
import { postSwapCancelled } from "../../exchange/swap";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setBroadcastTransaction } from "../../exchange/swap/setBroadcastTransaction";

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
  amountExpectedTo?: number;
  magnitudeAwareRate?: BigNumber;
  refundAddress?: string;
  payoutAddress?: string;
};
type FundStartParamsUiRequest = {
  exchangeType: "FUND";
};

type SellStartParamsUiRequest = {
  exchangeType: "SELL";
  provider: string;
  exchange: Partial<Exchange> | undefined;
};

type SwapStartParamsUiRequest = {
  exchangeType: "SWAP";
  provider: string;
  exchange: Partial<ExchangeSwap>;
};

type ExchangeStartParamsUiRequest =
  | FundStartParamsUiRequest
  | SellStartParamsUiRequest
  | SwapStartParamsUiRequest;

export type SwapUiRequest = CompleteExchangeUiRequest & {
  provider?: string;
  fromAccountId?: string;
  toAccountId?: string;
  tokenCurrency?: string;
};

type ExchangeUiHooks = {
  "custom.exchange.start": (params: {
    exchangeParams: ExchangeStartParamsUiRequest;
    onSuccess: (nonce: string, device?: ExchangeStartResult["device"]) => void;
    onCancel: (error: Error, device?: ExchangeStartResult["device"]) => void;
  }) => void;
  "custom.exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "custom.exchange.error": (params: {
    error: SwapLiveError | undefined;
    onSuccess: () => void;
    onCancel: () => void;
  }) => void;
  "custom.isReady": (params: { onSuccess: () => void; onCancel: () => void }) => void;
  "custom.exchange.swap": (params: {
    exchangeParams: SwapUiRequest;
    onSuccess: ({ operationHash, swapId }: { operationHash: string; swapId: string }) => void;
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
    "custom.exchange.error": uiError,
    "custom.isReady": uiIsReady,
    "custom.exchange.swap": uiSwap,
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
        if (!params) {
          tracking.startExchangeNoParams(manifest);
          return { transactionId: "" };
        }

        const trackingParams = {
          // @ts-expect-error ExchangeStartFundParams does not yet have the provider. Will be added in another iteration after a bugfix is confirmed
          // TODO: expect-error to be deleted after
          provider: params.provider,
          exchangeType: params.exchangeType,
        };

        tracking.startExchangeRequested(trackingParams);

        let exchangeParams: ExchangeStartParamsUiRequest;

        // Use `if else` instead of switch to leverage TS type narrowing and avoid `params` force cast.
        if (params.exchangeType == "SWAP") {
          exchangeParams = extractSwapStartParam(params, accounts);
        } else if (params.exchangeType == "SELL") {
          exchangeParams = extractSellStartParam(params, accounts);
        } else {
          exchangeParams = {
            exchangeType: params.exchangeType,
          };
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
            const currency = findTokenById(params.tokenCurrency);
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

        const { liveTx } = getWalletAPITransactionSignFlowInfos({
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

        const accountBridge = getAccountBridge(fromAccount, fromParentAccount);

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

      const {
        provider,
        fromAmount,
        fromAmountAtomic,
        quoteId,
        toNewTokenId,
        customFeeConfig,
        swapAppVersion,
      } = params;

      const trackingParams = {
        provider: params.provider,
        exchangeType: params.exchangeType,
      };

      tracking.startExchangeRequested(trackingParams);

      const exchangeStartParams: ExchangeStartParamsUiRequest = extractSwapStartParam(
        params,
        accounts,
      ) as SwapStartParamsUiRequest;

      const {
        fromCurrency,
        fromAccount,
        fromParentAccount,
        toCurrency,
        toAccount,
        toParentAccount,
      } = exchangeStartParams.exchange;

      if (!fromAccount || !fromCurrency) {
        throw new ServerError(createAccountNotFound(params.fromAccountId));
      }

      const fromAccountAddress = fromParentAccount
        ? fromParentAccount.freshAddress
        : (fromAccount as Account).freshAddress;

      const toAccountAddress = toParentAccount
        ? toParentAccount.freshAddress
        : (toAccount as Account).freshAddress;

      // Step 1: Open the drawer and open exchange app
      const startExchange = async () => {
        console.log("LLD   custom.exchange.swap uiExchangeStart", exchangeStartParams);

        return new Promise<{ transactionId: string; device?: ExchangeStartResult["device"] }>(
          (resolve, reject) => {
            uiExchangeStart({
              exchangeParams: exchangeStartParams,
              onSuccess: (nonce, device) => {
                tracking.startExchangeSuccess(trackingParams);
                resolve({ transactionId: nonce, device });
              },
              onCancel: error => {
                tracking.startExchangeFail(trackingParams);
                reject(error);
              },
            });
          },
        );
      };

      const { transactionId, device: deviceInfo } = await startExchange();

      const {
        binaryPayload,
        signature,
        payinAddress,
        swapId,
        payinExtraId,
        extraTransactionParameters,
      } = await retrieveSwapPayload({
        provider,
        deviceTransactionId: transactionId,
        fromAccountAddress,
        toAccountAddress,
        fromAccountCurrency: fromCurrency!.id,
        toAccountCurrency: toCurrency!.id,
        amount: fromAmount,
        amountInAtomicUnit: fromAmountAtomic,
        quoteId,
        toNewTokenId,
      }).catch((error: Error) => {
        throw error;
      });

      // Complete Swap
      const trackingCompleteParams = {
        provider: params.provider,
        exchangeType: params.exchangeType,
      };
      tracking.completeExchangeRequested(trackingCompleteParams);

      const strategyData = {
        recipient: payinAddress,
        amount: fromAmountAtomic,
        currency: fromCurrency as CryptoOrTokenCurrency,
        customFeeConfig: customFeeConfig ?? {},
        payinExtraId,
        extraTransactionParameters,
      };

      const transaction = await getStrategy(strategyData, "swap").catch(async error => {
        throw error;
      });

      const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
      const mainFromAccountFamily = mainFromAccount.currency.family;

      if (transaction.family !== mainFromAccountFamily) {
        return Promise.reject(
          new Error(
            `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${transaction.family}`,
          ),
        );
      }

      const accountBridge = getAccountBridge(fromAccount, fromParentAccount);

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
          recipient: transaction.recipient,
        },
        {
          ...transaction,
          feesStrategy: params.feeStrategy.toLowerCase(),
          subAccountId,
        },
      );

      // Get amountExpectedTo and magnitudeAwareRate from binary payload
      const decodePayload = await decodeSwapPayload(binaryPayload);
      const amountExpectedTo = new BigNumber(decodePayload.amountToWallet.toString());
      const magnitudeAwareRate = tx.amount && amountExpectedTo.dividedBy(tx.amount);
      const refundAddress = decodePayload.refundAddress;
      const payoutAddress = decodePayload.payoutAddress;

      // tx.amount should be BigNumber
      tx.amount = new BigNumber(tx.amount);

      return new Promise((resolve, reject) =>
        uiSwap({
          exchangeParams: {
            exchangeType: ExchangeType.SWAP,
            provider: params.provider,
            transaction: tx,
            signature: signature,
            binaryPayload: binaryPayload,
            exchange: {
              fromAccount,
              fromParentAccount,
              toAccount,
              toParentAccount,
              fromCurrency: fromCurrency!,
              toCurrency: toCurrency!,
            },
            feesStrategy: params.feeStrategy,
            swapId: swapId,
            amountExpectedTo: amountExpectedTo.toNumber(),
            magnitudeAwareRate,
            refundAddress,
            payoutAddress,
          },
          onSuccess: ({ operationHash, swapId }: { operationHash: string; swapId: string }) => {
            tracking.completeExchangeSuccess({
              ...trackingParams,
              currency: transaction.family,
            });

            setBroadcastTransaction({
              provider,
              result: { operation: operationHash, swapId },
              sourceCurrencyId: fromCurrency.id,
              targetCurrencyId: toCurrency?.id,
              hardwareWalletType: deviceInfo?.modelId as DeviceModelId,
              swapAppVersion,
            });

            resolve({ operationHash, swapId });
          },
          onCancel: error => {
            postSwapCancelled({
              provider: provider,
              swapId: swapId,
              swapStep: getSwapStepFromError(error),
              statusCode: error.name,
              errorMessage: error.message,
              sourceCurrencyId: fromCurrency.id,
              targetCurrencyId: toCurrency?.id,
              hardwareWalletType: deviceInfo?.modelId as DeviceModelId,
              swapType: quoteId ? "fixed" : "float",
              swapAppVersion,
            });

            reject(error);
          },
        }),
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
  }) as const satisfies Handlers;

function extractSwapStartParam(
  params: ExchangeStartSwapParams,
  accounts: AccountLike[],
): ExchangeStartParamsUiRequest {
  if (!("fromAccountId" in params && "toAccountId" in params)) {
    throw new ExchangeError(createWrongSwapParams(params));
  }

  const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
  if (!realFromAccountId) {
    throw new ExchangeError(createAccounIdNotFound(params.fromAccountId));
  }

  const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
  if (!fromAccount) {
    throw new ServerError(createAccountNotFound(params.fromAccountId));
  }

  let toAccount;

  if (params.exchangeType === "SWAP" && params.toAccountId) {
    const realToAccountId = getAccountIdFromWalletAccountId(params.toAccountId);
    if (!realToAccountId) {
      throw new ExchangeError(createAccounIdNotFound(params.toAccountId));
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

  return {
    exchangeType: params.exchangeType,
    provider: params.provider,
    exchange: {
      fromAccount,
      fromParentAccount,
      fromCurrency: getCurrencyForAccount(fromAccount),
      toAccount: newTokenAccount ? newTokenAccount : toAccount,
      toParentAccount: newTokenAccount ? toAccount : toParentAccount,
      toCurrency: getCurrencyForAccount(toAccount),
    },
  };
}

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

async function getToCurrency(
  binaryPayload: string,
  toAccount: AccountLike,
  newTokenAccount?: TokenAccount,
): Promise<CryptoOrTokenCurrency> {
  const { payoutAddress: tokenAddress, currencyTo } = await decodeSwapPayload(binaryPayload);

  // In case of an SPL Token recipient and no TokenAccount exists.
  if (
    toAccount.type !== "TokenAccount" && // it must no be a SPL Token
    toAccount.currency.id === "solana" && // the target account must be a SOL Account
    tokenAddress !== toAccount.freshAddress
  ) {
    const splTokenCurrency = listTokensForCryptoCurrency(toAccount.currency).find(
      tk => tk.tokenType === "spl" && tk.ticker === currencyTo,
    )!;
    return splTokenCurrency;
  }

  return newTokenAccount?.token ?? getCurrencyForAccount(toAccount);
}

interface StrategyParams {
  recipient: string;
  amount: BigNumber | number | string;
  currency: CryptoOrTokenCurrency;
  customFeeConfig?: Record<string, unknown>;
  payinExtraId?: string;
  extraTransactionParameters?: string;
}

async function getStrategy(
  {
    recipient,
    amount,
    currency,
    customFeeConfig,
    payinExtraId,
    extraTransactionParameters,
  }: StrategyParams,
  customErrorType?: any,
): Promise<Transaction> {
  const family =
    currency.type === "TokenCurrency"
      ? (currency.parentCurrency?.family as Transaction["family"])
      : (currency.family as Transaction["family"]);

  if (!family) {
    throw new Error(`TokenCurrency missing parentCurrency family: ${currency.id}`);
  }

  // Remove unsupported utxoStrategy for now
  if (customFeeConfig?.utxoStrategy) {
    delete customFeeConfig.utxoStrategy;
  }

  // Normalize family key for strategy lookup
  const familyKey = family === "evm" ? "ethereum" : family;
  const strategy = transactionStrategy?.[familyKey];

  if (!strategy) {
    throw new Error(`No transaction strategy found for family: ${familyKey}`);
  }

  try {
    return await strategy({
      family,
      amount,
      recipient,
      customFeeConfig: customFeeConfig || {},
      payinExtraId,
      extraTransactionParameters,
      customErrorType,
    });
  } catch (error) {
    throw new Error(
      `Failed to execute transaction strategy for family: ${familyKey}. Reason: ${(error as Error).message}`,
    );
  }
}
