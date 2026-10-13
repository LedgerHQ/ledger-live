import type { Job } from "@features/platform-device-intent";
import { Observable, type Subscription } from "rxjs";
import type { Transaction } from "../../../coin-modules/transaction-types";
import { createTerminalSignOperationJob } from "../../../intents/signTransactionIntent/createSignOperationJob";
import type { SignTransactionIntentInput } from "../../../intents/signTransactionIntent/types";
import { delay } from "../../../promise";
import { confirmTransferExchange } from "../../platform/transfer/completeExchange";
import { confirmSwapExchange } from "../../swap/completeExchange";
import { isExchangeSwap } from "../../types";
import { EXCHANGE_TYPE } from "../exchangeTypes";
import { createSessionTransport, normalizeError, toLegacyDevice } from "../shared";
import type {
  CompleteExchangeIntentInput,
  CompleteExchangeIntentJobState,
  CompleteExchangeIntentResult,
} from "./types";

/**
 * Same pause as the legacy confirmation: the Exchange app hands over to the coin app right after
 * the user approves, and signing too early reaches it before it is ready.
 */
export const EXCHANGE_HANDOVER_DELAY_MS = 3000;

/** What the Exchange app answers when the user rejects its review, once the step wrapped it. */
const REFUSAL_TITLES = new Set(["userRefused", "userRefusedCrossSeed"]);

function isUserRefusal(error: Error): boolean {
  if (error.name === "TransactionRefusedOnDevice") return true;
  return (
    error.name === "CompleteExchangeError" &&
    "title" in error &&
    typeof error.title === "string" &&
    REFUSAL_TITLES.has(error.title)
  );
}

/**
 * Signs the transaction the Exchange app confirmed. A refusal or a failure ends it: the nonce is
 * spent, so there is nothing to retry.
 */
const signConfirmedTransaction = createTerminalSignOperationJob<SignTransactionIntentInput>({
  getRefusalCurrency: (mainAccount, input) => input.tokenCurrency ?? mainAccount.currency,
  sign: ({ bridge, mainAccount, input, deviceId, deviceModelId }) =>
    bridge.signOperation({
      account: mainAccount,
      transaction: input.transaction,
      deviceId,
      deviceModelId,
    }),
});

/**
 * Confirms the exchange on the Exchange app (partner, payload, signature and address checks, then
 * the user's approval on the device), then has the coin app sign the transaction the Exchange app
 * hands over to it. Both run in the same device context, so they are one job.
 */
export const completeExchangeIntentJob: Job<
  CompleteExchangeIntentJobState,
  CompleteExchangeIntentInput,
  CompleteExchangeIntentResult
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) =>
  new Observable<CompleteExchangeIntentJobState>(subscriber => {
    const device = toLegacyDevice(deviceConnectionResult);
    let cancelled = false;
    let signSubscription: Subscription | undefined;

    subscriber.next({ type: "preparing", deviceModelId: device.modelId });

    const callbacks = {
      transport: createSessionTransport(deviceConnectionResult),
      isCancelled: () => cancelled,
      onConfirmationRequested: (estimatedFees: string) => {
        if (cancelled) return;
        subscriber.next({
          type: "awaiting-confirmation",
          deviceModelId: device.modelId,
          exchangeType: input.exchangeType,
          provider: input.provider,
          sponsored: input.sponsored ?? false,
          estimatedFees,
        });
      },
    };

    const confirm = (): Promise<Transaction> => {
      const { exchange, exchangeType, ...rest } = input;
      const common = { ...rest, deviceModelId: device.modelId };

      switch (exchangeType) {
        case EXCHANGE_TYPE.swap:
          if (!isExchangeSwap(exchange) || !exchange.toAccount) {
            throw new Error("'toAccount' requested for Swap exchange");
          }
          return confirmSwapExchange({ ...common, exchange, exchangeType }, callbacks);
        case EXCHANGE_TYPE.sell:
        case EXCHANGE_TYPE.fund:
          if (isExchangeSwap(exchange)) {
            throw new Error("Unexpected 'toAccount' for a sell or fund exchange");
          }
          return confirmTransferExchange({ ...common, exchange, exchangeType }, callbacks);
        default:
          throw new Error("exchangeType not handled");
      }
    };

    const sign = (preparedTransaction: Transaction) => {
      const { fromAccount, fromParentAccount } = input.exchange;
      signSubscription = signConfirmedTransaction({
        deviceConnectionResult,
        deviceExtractedContext,
        input: {
          account: fromAccount,
          parentAccount: fromParentAccount,
          transaction: preparedTransaction,
          tokenCurrency: fromAccount.type === "TokenAccount" ? fromAccount.token : undefined,
        },
        onResult,
      }).subscribe({
        next: state => subscriber.next(state),
        error: (error: unknown) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
    };

    const run = async () => {
      const preparedTransaction = await confirm();
      if (cancelled) return;

      subscriber.next({ type: "confirmed" });
      await delay(EXCHANGE_HANDOVER_DELAY_MS);
      if (cancelled) return;

      sign(preparedTransaction);
    };

    run().catch((error: unknown) => {
      if (cancelled) return;
      const normalized = normalizeError(error);
      if (isUserRefusal(normalized)) {
        onResult({ status: "refused", error: normalized });
        subscriber.next({ type: "refused" });
      } else {
        onResult({ status: "failed", error: normalized, deviceModelId: device.modelId });
        subscriber.next({ type: "error", error: normalized });
      }
      subscriber.complete();
    });

    return () => {
      cancelled = true;
      signSubscription?.unsubscribe();
    };
  });
