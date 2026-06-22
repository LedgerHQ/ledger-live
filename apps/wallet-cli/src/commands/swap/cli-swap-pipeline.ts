import { decodeSwapPayload } from "@ledgerhq/hw-app-exchange";
import type { ExchangeTypes, RateTypes } from "@ledgerhq/hw-app-exchange";
import { getMainAccount, getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, AccountLike, SignOperationEvent } from "@ledgerhq/types-live";
import { getCurrencyForAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { filter, tap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import type { CompleteExchangeRequestEvent } from "@ledgerhq/live-common/exchange/platform/types";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import { retrieveSwapPayload } from "@ledgerhq/live-common/exchange/swap/api/v5/actions";
import { postSwapCancelled } from "@ledgerhq/live-common/exchange/swap/postSwapState";
import { setBroadcastTransaction } from "@ledgerhq/live-common/exchange/swap/setBroadcastTransaction";
import { transactionStrategy } from "@ledgerhq/live-common/exchange/swap/transactionStrategies";
import type { Transaction } from "@ledgerhq/live-common/coin-modules/transaction-types";
import type { ExchangeRequestEvent } from "@ledgerhq/live-common/hw/actions/startExchange";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  getWalletCliDeviceModelId,
  WALLET_CLI_DMK_DEVICE_ID,
} from "../../device/register-dmk-transport";
import { withLedgerManagerAppSession } from "../../session/exchange-device-session";
import type {
  SwapPayloadRequestData,
  SwapPayloadResponse,
} from "@ledgerhq/live-common/exchange/swap/types";
import { CommandOutput } from "../../output";
import {
  CompleteExchangeError,
  getErrorDetails,
  getSwapStepFromError,
} from "@ledgerhq/live-common/exchange/error";

const EXCHANGE_SWAP: ExchangeTypes.Swap = 0x00;
const RATE_FIXED: RateTypes = 0x00;
const RATE_FLOATING: RateTypes = 0x01;

const EXCHANGE_APP_NAME = "Exchange";

export type CliSwapLog = (message: string) => void;

export type StartExchangeContext = {
  transactionId: string;
  deviceInfo: Device;
};

export type SwapPayloadOnlyInput = {
  provider: string;
  amount: string;
  amountInAtomicUnit: BigNumber;
  fromAccountAddress: string;
  toAccountAddress: string;
  fromAccountCurrency: string;
  toAccountCurrency: string;
  deviceTransactionId: string;
  quoteId?: string;
  correlationId?: string;
};

export async function runSwapPayloadOnly(
  input: SwapPayloadOnlyInput,
): Promise<SwapPayloadResponse> {
  const data: SwapPayloadRequestData = {
    provider: input.provider,
    deviceTransactionId: input.deviceTransactionId,
    fromAccountAddress: input.fromAccountAddress,
    toAccountAddress: input.toAccountAddress,
    fromAccountCurrency: input.fromAccountCurrency,
    toAccountCurrency: input.toAccountCurrency,
    amount: input.amount,
    amountInAtomicUnit: input.amountInAtomicUnit,
    ...(input.quoteId != null && input.quoteId !== "" ? { quoteId: input.quoteId } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
  };
  return retrieveSwapPayload(data);
}

export type FullSwapPipelineInput = {
  out: CommandOutput;
  provider: string;
  amount: string;
  amountInAtomicUnit: BigNumber;
  quoteId?: string;
  feeStrategy: string;
  fromAccount: AccountLike;
  toAccount: AccountLike;
  fromParentAccount?: Account;
  toParentAccount?: Account;
  getAccountBridge?: typeof getAccountBridge;
  getDeviceModelId?: typeof getWalletCliDeviceModelId;
};

export type FullSwapPipelineResult = {
  transactionId: string;
  payload: SwapPayloadResponse;
  operationHash?: string;
  swapId?: string;
  amountExpectedTo?: string;
  magnitudeAwareRate?: string;
};

function buildStrategyTransaction(args: {
  payinAddress: string;
  fromAmountAtomic: BigNumber;
  fromCurrency: CryptoOrTokenCurrency;
  payinExtraId?: string;
  extraTransactionParameters?: SwapPayloadResponse["extraTransactionParameters"];
}): Transaction {
  const { payinAddress, fromAmountAtomic, fromCurrency, payinExtraId, extraTransactionParameters } =
    args;
  const family =
    fromCurrency.type === "TokenCurrency"
      ? findCryptoCurrencyById(fromCurrency.parentCurrencyId)?.family
      : fromCurrency.family;
  if (!family) {
    throw new Error(`TokenCurrency missing parentCurrency family: ${fromCurrency.id}`);
  }
  const strategy = transactionStrategy[family as Transaction["family"]];
  if (!strategy) {
    throw new Error(`No transaction strategy found for family: ${family}`);
  }
  const built = strategy({
    family,
    amount: new BigNumber(fromAmountAtomic),
    recipient: payinAddress,
    customFeeConfig: {},
    payinExtraId,
    extraTransactionParameters,
    sponsored: false,
  });
  return built as Transaction;
}

async function startExchangeContext(
  out: CommandOutput,
  provider: string,
  getDeviceModelId: typeof getWalletCliDeviceModelId,
): Promise<StartExchangeContext> {
  out.swapExecuteProgress(
    `[1/5] Starting new exchange transaction on the device (open the ${EXCHANGE_APP_NAME} app when prompted)…`,
  );
  const device: Device = {
    deviceId: WALLET_CLI_DMK_DEVICE_ID,
    modelId: (await getDeviceModelId())!,
    wired: true,
  };
  const events = startExchange({
    device,
    exchangeType: EXCHANGE_SWAP,
    provider,
    appVersion: undefined,
  });
  const finalEvent = await firstValueFrom(
    events.pipe(
      tap((e: ExchangeRequestEvent) => {
        if (e.type === "start-exchange-error") {
          throw e.startExchangeError.error ?? new Error("start-exchange failed");
        }
      }),
      filter((e): e is Extract<ExchangeRequestEvent, { type: "start-exchange-result" }> => {
        return e.type === "start-exchange-result";
      }),
    ),
  );
  const transactionId = finalEvent.startExchangeResult.nonce;
  const deviceInfo = finalEvent.startExchangeResult.device;
  out.swapExecuteProgress(`[1/5] Device transaction id (nonce): ${transactionId}`);
  return { transactionId, deviceInfo };
}

async function completeExchangeTransaction(
  out: CommandOutput,
  input: {
    provider: string;
    binaryPayload: string;
    signature: string;
    rateType: RateTypes;
    transaction: Transaction;
    exchange: {
      fromAccount: AccountLike;
      fromParentAccount: Account | null | undefined;
      toAccount: AccountLike;
      toParentAccount: Account | null | undefined;
      fromCurrency: CryptoOrTokenCurrency;
      toCurrency: CryptoOrTokenCurrency;
    };
    getDeviceModelId: typeof getWalletCliDeviceModelId;
  },
): Promise<Transaction> {
  out.swapExecuteProgress(
    "[3/5] Completing exchange on device: partner checks, payout/refund validation, then confirm when the device asks…",
  );
  const obs = completeExchange({
    deviceId: WALLET_CLI_DMK_DEVICE_ID,
    deviceModelId: await input.getDeviceModelId(),
    provider: input.provider,
    binaryPayload: input.binaryPayload,
    signature: input.signature,
    rateType: input.rateType,
    exchangeType: EXCHANGE_SWAP,
    exchange: input.exchange,
    transaction: input.transaction,
  });

  const txEvent = await firstValueFrom(
    obs.pipe(
      tap((e: CompleteExchangeRequestEvent) => {
        if (e.type === "complete-exchange-error") {
          throw e.error;
        }
        if (e.type === "complete-exchange-requested") {
          out.swapExecuteProgress(`[4/5] Exchange accepted fee estimate`);
        }
      }),
      filter(
        (e): e is Extract<CompleteExchangeRequestEvent, { type: "complete-exchange-result" }> =>
          e.type === "complete-exchange-result",
      ),
    ),
  );
  out.swapExecuteProgress(
    "[4/5] Exchange flow finished; transaction is ready for the coin-app signature step.",
  );
  return txEvent.completeExchangeResult;
}

async function signAndBroadcast(
  out: CommandOutput,
  fromAccount: AccountLike,
  fromParentAccount: Account | null | undefined,
  transaction: Transaction,
  getBridge: typeof getAccountBridge,
): Promise<{ operationHash?: string }> {
  const mainAccount = getMainAccount(fromAccount, fromParentAccount);
  const bridge = await getBridge(fromAccount, fromParentAccount);
  out.swapExecuteProgress("[5/5] Signing and broadcasting — follow prompts on the device…");

  const sign$ = bridge.signOperation({
    account: mainAccount,
    transaction,
    deviceId: WALLET_CLI_DMK_DEVICE_ID,
  });

  const signed = await firstValueFrom(
    sign$.pipe(
      filter((e): e is Extract<SignOperationEvent, { type: "signed" }> => e.type === "signed"),
    ),
  );

  const hash = await bridge.broadcast({
    account: mainAccount,
    signedOperation: signed.signedOperation,
  });
  out.swapExecuteProgress(`[5/5] Broadcast complete. Operation hash: ${hash.hash}`);
  return { operationHash: hash.hash };
}

/**
 * Mirrors the wallet-api `custom.exchange.swap` pipeline: nonce → swap API payload → build tx →
 * complete exchange on device → sign and broadcast. UI hooks become `log` lines on stderr.
 */
export async function runFullSwapPipeline(
  input: FullSwapPipelineInput,
): Promise<FullSwapPipelineResult> {
  const {
    out,
    provider,
    amount,
    amountInAtomicUnit,
    quoteId,
    feeStrategy,
    fromAccount,
    toAccount,
    fromParentAccount: fromParent,
    toParentAccount: toParent,
    getAccountBridge: getBridge = getAccountBridge,
    getDeviceModelId = getWalletCliDeviceModelId,
  } = input;

  const accounts: AccountLike[] = [fromAccount, toAccount, fromParent, toParent].filter(
    (a): a is AccountLike => a != null,
  );
  const fromParentAccount = getParentAccount(fromAccount, accounts);
  const toParentAccount = getParentAccount(toAccount, accounts);
  const fromCurrency = getCurrencyForAccount(fromAccount);
  const toCurrency = getCurrencyForAccount(toAccount);

  const fromAccountAddress = fromParentAccount
    ? fromParentAccount.freshAddress
    : (fromAccount as Account).freshAddress;
  const toAccountAddress = toParentAccount
    ? toParentAccount.freshAddress
    : (toAccount as Account).freshAddress;
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
  const swapType = quoteId != null && quoteId !== "" ? ("fixed" as const) : ("float" as const);

  let swapId: string | undefined;
  let hardwareWalletType: Device["modelId"] | undefined;

  try {
    return await withLedgerManagerAppSession(EXCHANGE_APP_NAME, async () => {
      const { transactionId, deviceInfo } = await startExchangeContext(
        out,
        provider,
        getDeviceModelId,
      );
      hardwareWalletType = deviceInfo.modelId;

      out.swapExecuteProgress("[2/5] Requesting swap payload from Ledger swap API…");
      const payload = await retrieveSwapPayload({
        provider,
        deviceTransactionId: transactionId,
        fromAccountAddress,
        toAccountAddress,
        fromAccountCurrency: fromCurrency.id,
        toAccountCurrency: toCurrency.id,
        amount,
        amountInAtomicUnit,
        ...(quoteId != null && quoteId !== "" ? { quoteId } : {}),
      });
      out.swapExecuteProgress(
        `[2/5] Swap API returned swapId=${payload.swapId ?? "(none)"}, payin address received.`,
      );
      swapId = payload.swapId;

      const strategyTx = buildStrategyTransaction({
        payinAddress: payload.payinAddress,
        fromAmountAtomic: amountInAtomicUnit,
        fromCurrency,
        payinExtraId: payload.payinExtraId,
        extraTransactionParameters: payload.extraTransactionParameters,
      });

      if (strategyTx.family !== mainFromAccount.currency.family) {
        throw new Error(
          `Account and transaction must be from the same family. Account family: ${mainFromAccount.currency.family}, Transaction family: ${strategyTx.family}`,
        );
      }

      const accountBridge = await getBridge(fromAccount, fromParentAccount);
      const subAccountId =
        fromParentAccount && fromParentAccount.id !== fromAccount.id ? fromAccount.id : undefined;
      const bridgeTx = accountBridge.createTransaction(fromAccount);
      const tx = accountBridge.updateTransaction(
        { ...bridgeTx, recipient: strategyTx.recipient },
        {
          ...strategyTx,
          feesStrategy: feeStrategy.toLowerCase(),
          subAccountId,
        },
      );

      const decodePayload = await decodeSwapPayload(payload.binaryPayload);
      const amountExpectedTo = new BigNumber(decodePayload.amountToWallet.toString());
      const magnitudeAwareRate =
        tx.amount && new BigNumber(tx.amount).gt(0)
          ? amountExpectedTo.dividedBy(tx.amount)
          : undefined;
      tx.amount = new BigNumber(tx.amount);

      const rateType = quoteId != null && quoteId !== "" ? RATE_FIXED : RATE_FLOATING;

      const exchange = {
        fromAccount,
        fromParentAccount,
        toAccount,
        toParentAccount,
        fromCurrency,
        toCurrency,
      };

      const transaction = await completeExchangeTransaction(out, {
        provider,
        binaryPayload: payload.binaryPayload,
        signature: payload.signature,
        rateType,
        transaction: tx,
        exchange,
        getDeviceModelId,
      });
      const { operationHash } = await signAndBroadcast(
        out,
        fromAccount,
        fromParentAccount,
        transaction,
        getBridge,
      );

      if (swapId && operationHash) {
        setBroadcastTransaction({
          provider,
          result: { operation: operationHash, swapId },
          sourceCurrencyId: fromCurrency.id,
          targetCurrencyId: toCurrency.id,
          hardwareWalletType,
          swapType,
          fromAccountAddress,
          toAccountAddress,
          fromAmount: amount,
        });
      }

      return {
        transactionId,
        payload,
        operationHash,
        swapId: payload.swapId,
        amountExpectedTo: amountExpectedTo.toFixed(),
        ...(magnitudeAwareRate != null ? { magnitudeAwareRate: magnitudeAwareRate.toFixed() } : {}),
      };
    });
  } catch (error) {
    const {
      name: rawErrorName,
      message: rawErrorMessage,
      cause: rawErrorCause,
    } = getErrorDetails(error);
    const causeSuffix = rawErrorCause ? `, ${JSON.stringify(rawErrorCause)}` : "";
    const errorMessageWithCause = rawErrorMessage + causeSuffix;

    const completeExchangeError =
      error instanceof CompleteExchangeError
        ? error
        : new CompleteExchangeError("INIT", rawErrorName, errorMessageWithCause);

    if (swapId) {
      await postSwapCancelled({
        provider,
        swapId,
        swapStep: getSwapStepFromError(completeExchangeError),
        statusCode: completeExchangeError.title || completeExchangeError.name,
        errorMessage: completeExchangeError.message || errorMessageWithCause,
        sourceCurrencyId: fromCurrency.id,
        targetCurrencyId: toCurrency.id,
        hardwareWalletType,
        swapType,
        fromAccountAddress,
        toAccountAddress,
        fromAmount: amount,
      });
    }
    throw error;
  }
}
