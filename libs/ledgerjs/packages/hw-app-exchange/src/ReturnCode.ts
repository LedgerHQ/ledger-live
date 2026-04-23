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
  MEMORY_CORRUPTION: 0x6a8a,
  AMOUNT_FORMATTING_FAILED: 0x6a8b,
  APPLICATION_NOT_INSTALLED: 0x6a8c,
  WRONG_EXTRA_ID_OR_EXTRA_DATA: 0x6a8d,
  WRONG_TLV_CHALLENGE: 0x6a8e,
  WRONG_TLV_CONTENT: 0x6a8f,
  MISSING_TLV_CONTENT: 0x6a90,
  WRONG_TRUSTED_NAME_TLV: 0x6a91,
  USER_REFUSED_CROSS_SEED: 0x6a92,
  INVALID_INSTRUCTION: 0x6d00,
  UNEXPECTED_INSTRUCTION: 0x6d01,
  DESCRIPTOR_NOT_USED: 0x6d02,
  CLASS_NOT_SUPPORTED: 0x6e00,
  MALFORMED_APDU: 0x6e01,
  INVALID_DATA_LENGTH: 0x6e02,
  SIGN_VERIFICATION_FAIL: 0x9d1a,
} as const;

export function getExchangeErrorMessage(
  errorCode: number,
  step?: string,
): { errorName?: string; errorMessage?: string } {
  switch (errorCode) {
    case ErrorStatus.INCORRECT_COMMAND_DATA:
      return { errorName: "incorrectCommandData", errorMessage: "Incorrect command data" };
    case ErrorStatus.DESERIALIZATION_FAILED:
      return { errorName: "deserializationFailed", errorMessage: "Payload deserialzation failed" };
    case ErrorStatus.WRONG_TRANSACTION_ID:
      return { errorName: "wrongTransactionId", errorMessage: "Wrong transaction id" };
    case ErrorStatus.INVALID_ADDRESS:
      if (step === "CHECK_PAYOUT_ADDRESS")
        return {
          errorName: "checkPayoutAddress",
          errorMessage:
            "This receiving account does not belong to the device you have connected. Please change and retry",
        };
      else if (step === "CHECK_REFUND_ADDRESS")
        return {
          errorName: "checkRefundAddress",
          errorMessage:
            "This sending account does not belong to the device you have connected. Please change and retry",
        };
      return { errorName: "invalidAddress", errorMessage: "Invalid address" };
    case ErrorStatus.USER_REFUSED:
      return { errorName: "userRefused", errorMessage: "User refused" };
    case ErrorStatus.INTERNAL_ERROR:
      return { errorName: "internalError", errorMessage: "Internal error" };
    case ErrorStatus.WRONG_P1:
      return { errorName: "wrongP1", errorMessage: "Wrong P1" };
    case ErrorStatus.WRONG_P2:
      return { errorName: "wrongP2", errorMessage: "Wrong P2" };
    case ErrorStatus.WRONG_P2_EXTENSION:
      return { errorName: "wrongP2Extension", errorMessage: "Wrong P2 extension" };
    case ErrorStatus.INVALID_P2_EXTENSION:
      return { errorName: "invalidP2Extension", errorMessage: "Invalid P2 with current context" };
    case ErrorStatus.MEMORY_CORRUPTION:
      return { errorName: "memoryCorruption", errorMessage: "Memory corruption detected" };
    case ErrorStatus.AMOUNT_FORMATTING_FAILED:
      return {
        errorName: "amountFormattingFailed",
        errorMessage: "Amount formatting failed",
      };
    case ErrorStatus.APPLICATION_NOT_INSTALLED:
      return {
        errorName: "applicationNotInstalled",
        errorMessage:
          "The required application is not installed on your device. Please install it using Ledger Live",
      };
    case ErrorStatus.WRONG_EXTRA_ID_OR_EXTRA_DATA:
      return {
        errorName: "wrongExtraIdOrExtraData",
        errorMessage: "Wrong extra id or extra data",
      };
    case ErrorStatus.WRONG_TLV_CHALLENGE:
      return {
        errorName: "wrongTlvChallenge",
        errorMessage: "Wrong TLV challenge value",
      };
    case ErrorStatus.WRONG_TLV_CONTENT:
      return { errorName: "wrongTlvContent", errorMessage: "Wrong TLV content" };
    case ErrorStatus.MISSING_TLV_CONTENT:
      return { errorName: "missingTlvContent", errorMessage: "Missing TLV content" };
    case ErrorStatus.WRONG_TRUSTED_NAME_TLV:
      return { errorName: "wrongTrustedNameTlv", errorMessage: "Wrong trusted name TLV" };
    case ErrorStatus.USER_REFUSED_CROSS_SEED:
      return {
        errorName: "userRefusedCrossSeed",
        errorMessage: "User refused cross-seed transaction",
      };
    case ErrorStatus.UNEXPECTED_INSTRUCTION:
      return {
        errorName: "unexpectedInstruction",
        errorMessage: "Unexpected instruction with current context",
      };
    case ErrorStatus.CLASS_NOT_SUPPORTED:
      return { errorName: "classNotSupported", errorMessage: "Class not supported" };
    case ErrorStatus.INVALID_INSTRUCTION:
      return { errorName: "invalidInstruction", errorMessage: "Invalid instruction" };
    case ErrorStatus.MALFORMED_APDU:
      return { errorName: "malformedApdu", errorMessage: "APDU header malformed" };
    case ErrorStatus.INVALID_DATA_LENGTH:
      return {
        errorName: "invalidDataLength",
        errorMessage: "The length of this data is refused for this command",
      };
    case ErrorStatus.DESCRIPTOR_NOT_USED:
      return { errorName: "descriptorNotUsed", errorMessage: "Descriptor not used" };
    case ErrorStatus.SIGN_VERIFICATION_FAIL:
      return { errorName: "signVerificationFail", errorMessage: "Signature verification failed" };
  }
  return { errorName: undefined, errorMessage: undefined };
}
