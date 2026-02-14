import { TransportStatusError } from "@ledgerhq/errors";
import { getExchangeErrorMessage } from "@ledgerhq/hw-app-exchange";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/lib/ReturnCode";
import get from "lodash/get";

type ErrorCauseDetails = {
  name?: string;
  message?: string;
  swapCode?: string;
};

type ErrorDetails = {
  name?: string;
  message: string;
  cause?: ErrorCauseDetails;
};

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

export function getErrorDetails(error: unknown): ErrorDetails {
  if (error == null) return { message: "Unknown error" };
  if (typeof error === "string") return { message: error || "Unknown error" };

  const name: string | undefined = get(error, "name");
  const message: string | undefined = get(error, "message");
  const causeName: string | undefined = get(error, "cause.name");
  const causeMessage: string | undefined = get(error, "cause.message");
  const causeSwapCode: string | undefined = get(error, "cause.swapCode");

  const cause: ErrorCauseDetails | undefined =
    causeName || causeMessage || causeSwapCode
      ? { name: causeName, message: causeMessage, swapCode: causeSwapCode }
      : undefined;

  // Prefer a specific name; fall back to cause.name when top-level is generic "Error"
  const effectiveName = name && name !== "Error" ? name : causeName ?? name;

  return {
    ...(effectiveName ? { name: effectiveName } : {}),
    message: message || causeMessage || effectiveName || "Unknown error",
    ...(cause ? { cause } : {}),
  };
}

export function getErrorName(error: unknown): string | undefined {
  return getErrorDetails(error).name;
}

export function getErrorMessage(error: unknown): string {
  return getErrorDetails(error).message;
}

export function getSwapStepFromError(error: Error): string {
  const step = get(error, "step");
  if (typeof step === "string") {
    return step;
  } else if (error.name === "DisabledTransactionBroadcastError") {
    return "SIGN_COIN_TRANSACTION";
  }

  return "UNKNOWN_STEP";
}
