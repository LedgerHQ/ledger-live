/*
0x6A80 | INCORRECT_COMMAND_DATA   | The DATA sent does not match the correct format for the COMMAND specified               |
| 0x6A81 | DESERIALIZATION_FAILED   | Can't parse partner transaction proposal                                                |
| 0x6A82 | WRONG_TRANSACTION_ID     | Transaction ID is not equal to one generated on the START_NEW_TRANSACTION step          |
| 0x6A83 | INVALID_ADDRESS          | Refund or payout address doesn't belong to us                                           |
| 0x6A84 | USER_REFUSED             | User refused the transaction proposal                                                   |
| 0x6A85 | INTERNAL_ERROR           | Internal error of the application                                                       |
| 0x6A86 | WRONG_P1                 | The P1 value is not a valid RATE                                                        |
| 0x6A87 | WRONG_P2_SUBCOMMAND      | The P2 lower 4 bits of the P2 byte is not a valid SUBCOMMAND                            |
| 0x6A88 | WRONG_P2_EXTENSION       | The P2 upper 4 bits of the P2 byte is not a valid EXTENSION                             |
| 0x6A89 | INVALID_P2_EXTENSION     | The extension is a valid value but is refused in the current context                    |
| 0x6E00 | CLASS_NOT_SUPPORTED      | The CLASS is not 0xE0                                                                   |
| 0x6E01 | MALFORMED_APDU           | The APDU header is malformed                                                            |
| 0x6E02 | INVALID_DATA_LENGTH      | The length of the DATA is refused for this COMMAND                                      |
| 0x6D00 | INVALID_INSTRUCTION      | COMMAND is not in the "Possible commands" table                                         |
| 0x6D01 | UNEXPECTED_INSTRUCTION   | COMMAND is in the "Possible commands" table but is refused in the current context       |
| 0x9D1A | SIGN_VERIFICATION_FAIL   | The signature sent by this command does not match the data or the associated public key |
| 0x9000 | SUCCESS
*/
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

// const ErrorMessage: Record<keyof typeof ErrorStatus, string> = {
//   INCORRECT_COMMAND_DATA: "Incorrect command data",
//   DESERIALIZATION_FAILED: "Payload deserialzation failed",
//   WRONG_TRANSACTION_ID: "Wrond transaction id",
//   INVALID_ADDRESS: "Invalid address",
//   USER_REFUSED: "User refused",
//   INTERNAL_ERROR: "Internal error",
//   WRONG_P1: "Wrong P1",
//   WRONG_P2: "Wrong P2",
//   WRONG_P2_EXTENSION: "",
//   INVALID_P2_EXTENSION: "",
//   INVALID_INSTRUCTION: "Invalid instruction",
//   UNEXPECTED_INSTRUCTION: "",
//   CLASS_NOT_SUPPORTED: "Class not supported",
//   MALFORMED_APDU: "",
//   INVALID_DATA_LENGTH: "",
//   SIGN_VERIFICATION_FAIL: "Signature verification failed",
// };

export function getExchageErrorMessage(errorCode: number): string | undefined {
  switch (errorCode) {
    case ErrorStatus.INCORRECT_COMMAND_DATA:
      return "Incorrect command data";
    case ErrorStatus.DESERIALIZATION_FAILED:
      return "Payload deserialzation failed";
    case ErrorStatus.WRONG_TRANSACTION_ID:
      return "Wrond transaction id";
    case ErrorStatus.INVALID_ADDRESS:
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
      return "";
    case ErrorStatus.INVALID_P2_EXTENSION:
      return "";
    case ErrorStatus.UNEXPECTED_INSTRUCTION:
      return "";
    case ErrorStatus.CLASS_NOT_SUPPORTED:
      return "Class not supported";
    case ErrorStatus.INVALID_INSTRUCTION:
      return "Invalid instruction";
    case ErrorStatus.MALFORMED_APDU:
      return "";
    case ErrorStatus.INVALID_DATA_LENGTH:
      return "";
    case ErrorStatus.SIGN_VERIFICATION_FAIL:
      return "Signature verification failed";
  }
  return undefined;
}
