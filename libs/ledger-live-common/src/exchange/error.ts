import { TransportStatusError } from "@ledgerhq/errors";
import { getExchangeErrorMessage } from "@ledgerhq/hw-app-exchange";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/lib/ReturnCode";
import get from "lodash/get";

export type CompleteExchangeStep =
  | "INIT"
  | "SET_PARTNER_KEY"
  | "CHECK_PARTNER"
  | "PROCESS_TRANSACTION"
  | "CHECK_TRANSACTION_SIGNATURE"
  | "CHECK_PAYOUT_ADDRESS"
  | "CHECK_REFUND_ADDRESS"
  | "SIGN_COIN_TRANSACTION";

export class CompleteExchangeError extends Error {
  step: CompleteExchangeStep;
  title?: string;

  constructor(step: CompleteExchangeStep, title?: string, message?: string) {
    super(message);
    this.name = "CompleteExchangeError";
    this.title = title;
    this.step = step;
  }
}

export function convertTransportError(
  step: CompleteExchangeStep,
  err: unknown,
): CompleteExchangeError | unknown {
  if (err instanceof TransportStatusError) {
    const errorCode =
      step === "CHECK_REFUND_ADDRESS" && err.statusCode == null
        ? ErrorStatus.INVALID_ADDRESS
        : err.statusCode;

    const { errorName, errorMessage } = getExchangeErrorMessage(errorCode, step);
    return new CompleteExchangeError(step, errorName, errorMessage);
  }
  return err;
}

export function getErrorName(error: unknown): string | undefined {
  return get(error, "name") || get(error, "cause.name");
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error.trim() ? error : "Unknown error";

  return get(error, "message") || get(error, "cause.message") || "Unknown error";
}

export function getSwapStepFromError(error: Error): string {
  if ((error as CompleteExchangeError).step) {
    return (error as CompleteExchangeError).step;
  } else if (error.name === "DisabledTransactionBroadcastError") {
    return "SIGN_COIN_TRANSACTION";
  }

  return "UNKNOWN_STEP";
}
