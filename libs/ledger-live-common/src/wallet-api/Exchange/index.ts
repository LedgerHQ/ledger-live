// Export all error classes
export {
  SwapError,
  NonceStepError,
  PayloadStepError,
  SignatureStepError,
  IgnoredSignatureStepError,
  NotEnoughFunds,
  ListAccountError,
  ListCurrencyError,
  UnknownAccountError,
  PayinExtraIdError,
} from "./SwapError";

// Export parser utilities
export { createStepError, StepError, CustomErrorType, type ParseError } from "./parser";

// Export error handler
export {
  handleErrors,
  isHandledError,
  getSwapCode,
  type ErrorHandlerOptions,
} from "./handleSwapErrors";
