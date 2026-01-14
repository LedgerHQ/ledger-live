/**
 * Error Parser
 * Routes errors to appropriate error classes based on step and context
 */

import {
  IgnoredSignatureStepError,
  ListAccountError,
  ListCurrencyError,
  NonceStepError,
  NotEnoughFunds,
  PayinExtraIdError,
  PayloadStepError,
  SignatureStepError,
  UnknownAccountError,
} from "./SwapError";

/**
 * Transaction step where error occurred
 */
export enum StepError {
  NONCE = "NonceStepError",
  PAYLOAD = "PayloadStepError",
  SIGNATURE = "SignatureStepError",
  IGNORED_SIGNATURE = "IgnoredSignatureStepError",
  CHECK_FUNDS = "CheckFundsStepError",
  LIST_ACCOUNT = "ListAccountStepError",
  LIST_CURRENCY = "ListCurrencyStepError",
  UNKNOWN_ACCOUNT = "UnknownAccountStepError",
  PAYIN_EXTRA_ID = "PayinExtraIdStepError",
}

/**
 * Input for error parsing
 */
export enum CustomErrorType {
  SWAP = "swap",
}

export type ParseError = {
  error: Error;
  step?: StepError;
  customErrorType?: CustomErrorType;
};

/**
 * Maps step errors to error constructors
 */
const ErrorMap: Record<StepError, new (err?: Error) => Error> = {
  [StepError.NONCE]: NonceStepError,
  [StepError.PAYLOAD]: PayloadStepError,
  [StepError.SIGNATURE]: SignatureStepError,
  [StepError.IGNORED_SIGNATURE]: IgnoredSignatureStepError,
  [StepError.CHECK_FUNDS]: NotEnoughFunds,
  [StepError.LIST_ACCOUNT]: ListAccountError,
  [StepError.LIST_CURRENCY]: ListCurrencyError,
  [StepError.UNKNOWN_ACCOUNT]: UnknownAccountError,
  [StepError.PAYIN_EXTRA_ID]: PayinExtraIdError,
};

/**
 * Creates a step-specific error by wrapping the original error
 *
 * @param error - Original error that occurred
 * @param step - Step where error occurred (optional)
 * @returns Wrapped error or original error if no step specified
 */
export function createStepError({ error, step }: ParseError): Error {
  // If no step specified, return original error
  if (!step) {
    return error;
  }

  // Get error constructor for this step
  const ErrorConstructor = ErrorMap[step];

  if (!ErrorConstructor) {
    return error;
  }

  // Wrap original error in step-specific error class
  return new ErrorConstructor(error);
}

/**
 * Parses an error to determine the correct error class to return based on the context.
 */
export function parseError({ error, step, customErrorType }: ParseError): Error {
  if (!step || customErrorType !== CustomErrorType.SWAP) {
    return error;
  }

  return createStepError({ error, step });
}

export const hasMessage = (value: unknown): value is { message?: unknown } =>
  Boolean(value && typeof value === "object" && "message" in value);

export const toError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }

  if (hasMessage(value) && typeof value.message === "string") {
    return new Error(value.message);
  }

  return new Error(
    typeof value === "string"
      ? value
      : (() => {
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        })(),
  );
};
