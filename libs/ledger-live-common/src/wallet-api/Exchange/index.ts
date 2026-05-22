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

// Swap quotes (Wallet API getQuotes; HTTP-only fetch stays internal to `quotes/getQuotes`)
export { getQuotes } from "./quotes";
export type * from "./quotes";

// DEX execution helpers used by `custom.swap` device-intent flows
export {
  buildProviderTransactionData,
  isDexExecutionProvider,
  DEFAULT_DEX_GAS_LIMIT,
  DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
} from "./dex";
export type {
  DexBuildContext,
  DexProvider,
  DexProviderTransactionData,
  DexTransactionData,
} from "./dex";
