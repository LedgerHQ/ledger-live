import { getExchangeErrorMessage } from "@ledgerhq/hw-app-exchange";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * What an exchange step threw, as an `Error`. The DMK session behind a Device Intent job rejects
 * with `{ _tag }` objects, and other code with plain objects, which `String()` would turn into
 * "[object Object]". Their tag or name, message and status code are kept: the app's error copy is
 * keyed on the name, and the step's error mapping reads the status code.
 */
export function toExchangeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error !== "object" || error === null) return new Error(String(error));

  const tag: unknown = get(error, "_tag");
  const name: unknown = isNonEmptyString(tag) ? tag : get(error, "name");
  const message = [get(error, "originalError.message"), get(error, "message")].find(
    isNonEmptyString,
  );

  const fallbackMessage = isNonEmptyString(name) ? name : String(error);
  const converted = new Error(message ?? fallbackMessage, { cause: error });
  if (isNonEmptyString(name)) converted.name = name;

  const statusCode: unknown = get(error, "statusCode");
  if (typeof statusCode === "number") Object.assign(converted, { statusCode });
  return converted;
}

export function convertTransportError(
  step: CompleteExchangeStep,
  err: unknown,
): CompleteExchangeError | unknown {
  if ((err as { name?: string })?.name === "TransportStatusError") {
    const tse = err as { statusCode?: number | null; statusText?: string };
    let errorCode: number;
    if (typeof tse.statusCode === "number") {
      errorCode = tse.statusCode;
    } else if (step === "CHECK_REFUND_ADDRESS") {
      errorCode = ErrorStatus.INVALID_ADDRESS;
    } else {
      return err;
    }
    const { errorName, errorMessage } = getExchangeErrorMessage(errorCode, step);
    return new CompleteExchangeError(
      step,
      errorName,
      errorMessage ?? getUnknownDeviceStatusMessage(errorCode, tse.statusText),
    );
  }
  return err;
}

/**
 * Keeps the raw status code of an unmapped device response so it can be grouped on in monitoring.
 * The title stays undefined: swap-service buckets cancellations by exact `statusCode` match.
 */
function getUnknownDeviceStatusMessage(statusCode: number, statusText?: string): string {
  const hexCode = `0x${statusCode.toString(16).padStart(4, "0")}`;
  return statusText
    ? `Unknown device status ${hexCode} (${statusText})`
    : `Unknown device status ${hexCode}`;
}

const SIGN_VERIFICATION_FAIL_TITLE = "signVerificationFail";

/**
 * The Exchange app rejected the provider signature over the swap payload. This happens before
 * anything is shown on the device, and a new `/swap` call returns a new payload and signature.
 */
export function getIsSwapSignatureVerificationError(error: unknown): boolean {
  return (
    get(error, "name") === "CompleteExchangeError" &&
    get(error, "step") === "CHECK_TRANSACTION_SIGNATURE" &&
    get(error, "title") === SIGN_VERIFICATION_FAIL_TITLE
  );
}

/**
 * Tags a signature rejection with the attempt it happened on: "Code: R0" for the first attempt,
 * then R1, R2 for the retries.
 */
export function withSignatureRetryCode(
  error: CompleteExchangeError,
  retryCount: number,
): CompleteExchangeError {
  if (!getIsSwapSignatureVerificationError(error)) return error;
  return new CompleteExchangeError(
    error.step,
    error.title,
    `${error.message} Code: R${retryCount}`,
  );
}

/**
 * `executeSwap` restarts the swap after this error, so the host must not display it.
 */
export function getIsSwapRetryPending(
  request: { willRetryOnSignatureError?: boolean },
  error: unknown,
): boolean {
  return request.willRetryOnSignatureError === true && getIsSwapSignatureVerificationError(error);
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
  const effectiveName = name && name !== "Error" ? name : (causeName ?? name);

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
