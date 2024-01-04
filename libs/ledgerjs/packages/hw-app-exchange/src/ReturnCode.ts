/**
 * Those values map the one defined in the app-exchange code (@see protocol.md and swap_errors.h)
 */
export const OkStatus = 0x9000;
export const ErrorStatus = {
  INCORRECT_COMMAND_DATA: 0x6a80,
  DESERIALIZATION_FAILED: 0x6a81,
  WRONG_TRANSACTION_ID: 0x6a82,
  INVALID_ADDRESS: 0x6a83,
  USER_REFUSED: 0x6a84,
  INTERNAL_ERROR: 0x6a85,
  WRONG_P1: 0x6a86,
  WRONG_P2: 0x6a87,
  WRONG_P2_EXTENSION: 0x6a88,
  INVALID_P2_EXTENSION: 0x6a89,
  INVALID_INSTRUCTION: 0x6d00,
  UNEXPECTED_INSTRUCTION: 0x6d01,
  CLASS_NOT_SUPPORTED: 0x6e00,
  MALFORMED_APDU: 0x6e01,
  INVALID_DATA_LENGTH: 0x6e02,
  SIGN_VERIFICATION_FAIL: 0x9d1a,
} as const;

export function getExchangeErrorMessage(errorCode: number, step?: string): string | undefined {
  switch (errorCode) {
    case ErrorStatus.INCORRECT_COMMAND_DATA:
      return "Incorrect command data";
    case ErrorStatus.DESERIALIZATION_FAILED:
      return "Payload deserialzation failed";
    case ErrorStatus.WRONG_TRANSACTION_ID:
      return "Wrond transaction id";
    case ErrorStatus.INVALID_ADDRESS:
      if (step === "CHECK_PAYOUT_ADDRESS")
        return "This receiving account does not belong to your device. Please change and retry."
      else if (step === "CHECK_REFUND_ADDRESS")
        return "This receiving account does not belong to your device for the refund. Please change and retry.";
      return "Invalid address";
    case ErrorStatus.USER_REFUSED:
      return "User refused";
    case ErrorStatus.INTERNAL_ERROR:
      return "Internal error";
    case ErrorStatus.WRONG_P1:
      return "Wrong P1";
    case ErrorStatus.WRONG_P2:
      return "Wrong P2";
    case ErrorStatus.WRONG_P2_EXTENSION:
      return "Wrong P2 extension";
    case ErrorStatus.INVALID_P2_EXTENSION:
      return "Invalid P2 with current context";
    case ErrorStatus.UNEXPECTED_INSTRUCTION:
      return "Unexpected instruction with current context";
    case ErrorStatus.CLASS_NOT_SUPPORTED:
      return "Class not supported";
    case ErrorStatus.INVALID_INSTRUCTION:
      return "Invalid instruction";
    case ErrorStatus.MALFORMED_APDU:
      return "APDU header malformed";
    case ErrorStatus.INVALID_DATA_LENGTH:
      return "The length of this data is refused for this command";
    case ErrorStatus.SIGN_VERIFICATION_FAIL:
      return "Signature verification failed";
  }
  return undefined;
}
