enum ProviderErrorCodes {
  FAILED_TO_GET_QUOTE_ERROR = "failed_to_get_quote_error",
  AMOUNT_OFF_LIMITS = "amount_off_limits",
}

interface ProviderError {
  code: string;
  originalCode: string;
  message: string;
  provider: string;
}
