import {
  getMainAccount,
  getParentAccount,
  makeEmptyTokenAccount,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { decodeSwapPayload } from "@ledgerhq/hw-app-exchange";
import { Account, AccountLike, getCurrencyForAccount } from "@ledgerhq/types-live";
import { createAccountNotFound, ServerError } from "@ledgerhq/wallet-api-core";
import {
  ExchangeStartResult,
  ExchangeStartSwapParams,
  ExchangeSwapParams,
  ExchangeType,
  SwapResult,
} from "@ledgerhq/wallet-api-exchange-module";
import { BigNumber } from "bignumber.js";
import get from "lodash/get";
import type { Transaction as EvmTransaction } from "../../families/evm/types";
import { padHexString } from "@ledgerhq/hw-app-eth";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getAccountBridge } from "../../bridge";
import { Transaction } from "../../coin-modules/transaction-types";
import { CompleteExchangeError, getErrorDetails, getSwapStepFromError } from "../../exchange/error";
import { postSwapCancelled } from "../../exchange/swap";
import { retrieveSwapPayload } from "../../exchange/swap/api/v5/actions";
import { setBroadcastTransaction } from "../../exchange/swap/setBroadcastTransaction";
import { transactionStrategy } from "../../exchange/swap/transactionStrategies";
import { FeatureFlags } from "../../exchange/swap/types";
import { getAccountIdFromWalletAccountId } from "../converters";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import { createAccounIdNotFound, createWrongSwapParams, ExchangeError } from "./error";
import { handleErrors } from "./handleSwapErrors";
import { createStepError, StepError, toError } from "./parser";
import { SwapError } from "./SwapError";
import { TrackingAPI } from "./tracking";
import type {
  ExchangeStartParamsUiRequest,
  ExchangeUiHooks,
  SwapStartParamsUiRequest,
} from "./uiRequests";

/**
 * Everything the swap needs that the wallet-api handler factory would otherwise
 * capture. The hooks are the only host-specific part: whoever calls this decides
 * which screens drive the device steps.
 */
export type SwapDeps = {
  accounts: AccountLike[];
  tracking: TrackingAPI;
  flags?: FeatureFlags;
  getFeature?: GetFeatureFn;
  uiHooks: Pick<
    ExchangeUiHooks,
    "custom.exchange.start" | "custom.exchange.swap" | "custom.exchange.error"
  >;
};

/**
 * Runs a swap end to end: nonce on device, provider payload, funding
 * transaction, then the device confirmation / signature / broadcast the caller's
 * `custom.exchange.swap` hook is responsible for.
 *
 * Shared by the `custom.exchange.swap` RPC handler (live apps) and by in-app
 * flows that need the same sequence behind their own screens, so the two can't
 * drift apart.
 */
export async function executeSwap(
  { accounts, tracking, flags, getFeature, uiHooks }: SwapDeps,
  params: ExchangeSwapParams,
): Promise<SwapResult> {
  const {
    "custom.exchange.start": uiExchangeStart,
    "custom.exchange.swap": uiSwap,
    "custom.exchange.error": uiError,
  } = uiHooks;

  try {
    const {
      provider,
      fromAmount,
      fromAmountAtomic,
      quoteId,
      toNewTokenId,
      customFeeConfig,
      swapAppVersion,
      sponsored,
      isEmbedded,
      swapEntryPoint,
      correlationId,
    } = params;

    const trackingParams = {
      provider: params.provider,
      exchangeType: params.exchangeType,
      isEmbeddedSwap: isEmbedded,
      swapEntryPoint,
    };

    tracking.startExchangeRequested(trackingParams);

    const exchangeStartParams: ExchangeStartParamsUiRequest = (await extractSwapStartParam(
      params,
      accounts,
    )) as SwapStartParamsUiRequest;

    const { fromCurrency, fromAccount, fromParentAccount, toCurrency, toAccount, toParentAccount } =
      exchangeStartParams.exchange;

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

    let transactionId: string;
    let deviceInfo: ExchangeStartResult["device"];

    try {
      const result = await startExchange();
      transactionId = result.transactionId;
      deviceInfo = result.device;
    } catch (error) {
      const rawError = get(error, "response.data.error", error);
      const wrappedError = createStepError({
        error: toError(rawError),
        step: StepError.NONCE,
        correlationId: params?.correlationId,
      });
      throw wrappedError;
    }

    tracking.swapPayloadRequested({
      provider,
      transactionId,
      fromAccountAddress,
      toAccountAddress,
      fromCurrencyId: fromCurrency!.id,
      toCurrencyId: toCurrency?.id,
      fromAmount,
      quoteId,
    });

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
      flags,
      correlationId,
    }).catch((error: Error) => {
      const wrappedError = createStepError({
        error: get(error, "response.data.error", error),
        step: StepError.PAYLOAD,
        correlationId: params?.correlationId,
      });
      throw wrappedError;
    });

    tracking.swapResponseRetrieved({
      binaryPayload,
      signature,
      payinAddress,
      swapId,
      payinExtraId,
      extraTransactionParameters,
    });

    tracking.completeExchangeRequested(trackingParams);

    const strategyData = {
      recipient: payinAddress,
      amount: fromAmountAtomic,
      currency: fromCurrency as CryptoOrTokenCurrency,
      customFeeConfig: customFeeConfig ?? {},
      payinExtraId,
      extraTransactionParameters,
      sponsored,
    };

    const transaction: Transaction = await getStrategy(strategyData, "swap", getFeature);

    const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);

    if (transaction.family !== mainFromAccount.currency.family) {
      throw new Error(
        `Account and transaction must be from the same family. Account family: ${mainFromAccount.currency.family}, Transaction family: ${transaction.family}`,
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
          sponsored,
          isEmbeddedSwap: isEmbedded,
          swapEntryPoint,
          ...(correlationId && { correlationId }),
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
            fromAccountAddress,
            toAccountAddress,
            fromAmount,
            flags,
          });

          resolve({ operationHash, swapId });
        },
        onCancel: error => {
          const {
            name: rawErrorName,
            message: rawErrorMessage,
            cause: rawErrorCause,
          } = getErrorDetails(error);
          const causeSuffix = rawErrorCause ? `, ${JSON.stringify(rawErrorCause)}` : "";
          const errorMessageWithCause = rawErrorMessage + causeSuffix;

          const completeExchangeError =
            // step provided in libs/ledger-live-common/src/exchange/platform/transfer/completeExchange.ts
            error instanceof CompleteExchangeError
              ? error
              : new CompleteExchangeError("INIT", rawErrorName, errorMessageWithCause);

          postSwapCancelled({
            provider: provider,
            swapId: swapId,
            swapStep: getSwapStepFromError(completeExchangeError),
            statusCode: completeExchangeError.title || completeExchangeError.name,
            errorMessage: completeExchangeError.message || errorMessageWithCause,
            sourceCurrencyId: fromCurrency.id,
            targetCurrencyId: toCurrency?.id,
            hardwareWalletType: deviceInfo?.modelId as DeviceModelId,
            swapType: quoteId ? "fixed" : "float",
            swapAppVersion,
            fromAccountAddress,
            toAccountAddress,
            refundAddress,
            payoutAddress,
            fromAmount,
            seedIdFrom: mainFromAccount.seedIdentifier,
            seedIdTo: toParentAccount?.seedIdentifier || (toAccount as Account)?.seedIdentifier,
            data: (transaction as EvmTransaction).data
              ? `0x${padHexString((transaction as EvmTransaction).data?.toString("hex") || "")}`
              : "0x",
            flags,
          });

          reject(completeExchangeError);
        },
      }),
    );
  } catch (error) {
    // Skip DrawerClosedError
    // do not redirect to the error screen
    if (isDrawerClosedError(error)) {
      throw error;
    }

    // Global catch for any errors during the swap process
    // moved out as sonarcloud suggested to avoid 4 level nested functions
    const createErrorRejector = (error: SwapError, reject: (error: SwapError) => void) => {
      return () => reject(error);
    };

    const displayError = (error: SwapError): Promise<void> =>
      new Promise((resolve, reject) => {
        const rejectWithError = createErrorRejector(error, reject);
        uiError({
          error,
          onSuccess: rejectWithError,
          onCancel: rejectWithError,
        });
      });

    handleErrors(error, {
      onDisplayError: displayError,
    });

    throw error;
  }
}

export async function extractSwapStartParam(
  params: ExchangeStartSwapParams,
  accounts: AccountLike[],
): Promise<ExchangeStartParamsUiRequest> {
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

  const currency = params.tokenCurrency
    ? await getCryptoAssetsStore().findTokenById(params.tokenCurrency)
    : null;
  const newTokenAccount = currency ? makeEmptyTokenAccount(toAccount, currency) : null;
  const resolvedToAccount = newTokenAccount ?? toAccount;

  return {
    exchangeType: params.exchangeType,
    provider: params.provider,
    exchange: {
      fromAccount,
      fromParentAccount,
      fromCurrency: getCurrencyForAccount(fromAccount),
      toAccount: resolvedToAccount,
      toParentAccount,
      toCurrency: getCurrencyForAccount(resolvedToAccount),
    },
  };
}

interface StrategyParams {
  recipient: string;
  amount: BigNumber | number | string;
  currency: CryptoOrTokenCurrency;
  customFeeConfig?: Record<string, unknown>;
  payinExtraId?: string;
  extraTransactionParameters?: string;
  sponsored?: boolean;
}

async function getStrategy(
  {
    recipient,
    amount,
    currency,
    customFeeConfig,
    payinExtraId,
    extraTransactionParameters,
    sponsored,
  }: StrategyParams,
  customErrorType?: any,
  getFeature?: GetFeatureFn,
): Promise<Transaction> {
  const family =
    currency.type === "TokenCurrency"
      ? findCryptoCurrencyById(currency.parentCurrencyId)?.family
      : currency.family;

  if (!family) {
    throw new Error(`TokenCurrency missing parentCurrency family: ${currency.id}`);
  }

  // Remove unsupported utxoStrategy for now
  if (customFeeConfig?.utxoStrategy) {
    delete customFeeConfig.utxoStrategy;
  }

  const strategy = transactionStrategy?.[family];

  if (!strategy) {
    throw new Error(`No transaction strategy found for family: ${family}`);
  }

  // Convert customFeeConfig values to BigNumber
  const convertedCustomFeeConfig: { [key: string]: BigNumber } = {};
  if (customFeeConfig) {
    for (const [key, value] of Object.entries(customFeeConfig)) {
      convertedCustomFeeConfig[key] = new BigNumber(value?.toString() || 0);
    }
  }

  return strategy(
    {
      family,
      amount: new BigNumber(amount),
      recipient,
      customFeeConfig: convertedCustomFeeConfig,
      payinExtraId,
      extraTransactionParameters,
      customErrorType,
      sponsored,
    },
    getFeature,
  );
}

function isDrawerClosedError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = getErrorDetails(error);
  return details.name === "DrawerClosedError" || details.cause?.name === "DrawerClosedError";
}
