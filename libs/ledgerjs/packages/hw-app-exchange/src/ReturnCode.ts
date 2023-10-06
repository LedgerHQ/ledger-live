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
  CLASS_NOT_SUPPORTED: 0x6e00,
  INVALID_INSTRUCTION: 0x6d00,
  SIGN_VERIFICATION_FAIL: 0x9d1a,
} as const;
