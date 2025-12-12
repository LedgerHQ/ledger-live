/**
 * Simplified Swap Error System
 * Base error class and specific error types for swap transaction flows
 */

/**
 * Base error class for all swap-related errors
 * Contains error code and nested error information
 */
export class SwapError extends Error {
  cause: {
    swapCode: string;
    [key: string]: string | Error | unknown | undefined;
  };
  message: string;

  constructor(code = "swap000", nestedError?: Error) {
    super();
    this.name = "SwapError";

    // Preserve nested error information
    this.cause = {
      swapCode: code,
      ...(nestedError?.constructor !== Object && nestedError?.constructor !== Array
        ? { message: `${nestedError}` }
        : {}),
      ...nestedError,
    };

    this.message = nestedError?.message ? nestedError.message : `${nestedError}`;
  }
}

/**
 * Error during nonce/deviceTransactionId generation step
 * Typically occurs when calling startSwap()
 */
export class NonceStepError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap001", nestedError);
    this.name = "NonceStepError";
  }
}

/**
 * Error during payload retrieval step
 * Occurs when communicating with backend to get transaction payload
 */
export class PayloadStepError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap002", nestedError);
    this.name = "PayloadStepError";
  }
}

/**
 * Error during transaction signature step
 * Occurs when user rejects or device fails during completeSwap()
 */
export class SignatureStepError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap003", nestedError);
    this.name = "SignatureStepError";
  }
}

/**
 * Special case: signature error that should be ignored/handled silently
 * Used for expected user cancellations
 */
export class IgnoredSignatureStepError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap003Ignored", nestedError);
    this.name = "SignatureStepError";
  }
}

/**
 * Error when user doesn't have sufficient funds
 * Thrown during balance validation
 */
export class NotEnoughFunds extends SwapError {
  constructor() {
    super("swap004");
    this.name = "NotEnoughFunds";
  }
}

/**
 * Error when unable to retrieve account list
 * Occurs during account lookup phase
 */
export class ListAccountError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap005", nestedError);
    this.name = "ListAccountError";
  }
}

/**
 * Error when unable to retrieve currency information
 * Occurs during currency lookup phase
 */
export class ListCurrencyError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap006", nestedError);
    this.name = "ListCurrencyError";
  }
}

/**
 * Error when specified account ID cannot be found
 * Thrown when fromAccountId or toAccountId is invalid
 */
export class UnknownAccountError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap007", nestedError);
    this.name = "UnknownAccountError";
  }
}

/**
 * Error when extra identifier is required but missing
 * Some chains require payinExtraId (e.g., XLM memo, XRP tag)
 */
export class PayinExtraIdError extends SwapError {
  constructor(nestedError?: Error) {
    super("swap010", nestedError);
    this.name = "PayinExtraIdError";
  }
}

/**
 * CompleteSwap/CompleteExchange step information
 * Tracks which hardware wallet step failed
 */
export type CompleteExchangeStep =
  | "INIT"
  | "SET_PARTNER_KEY"
  | "CHECK_PARTNER"
  | "PROCESS_TRANSACTION"
  | "CHECK_TRANSACTION_SIGNATURE"
  | "CHECK_PAYOUT_ADDRESS"
  | "CHECK_REFUND_ADDRESS"
  | "SIGN_COIN_TRANSACTION";

/**
 * Error that occurs during completeSwap with step tracking
 * Useful for debugging hardware wallet interactions
 */
export class CompleteExchangeError extends Error {
  step: CompleteExchangeStep;

  constructor(step: CompleteExchangeStep, message?: string) {
    super(message);
    this.name = "CompleteExchangeError";
    this.step = step;
  }
}
