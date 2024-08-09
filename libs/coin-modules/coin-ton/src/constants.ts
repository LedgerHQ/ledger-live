/**
 * Maximum commission fee for jetton transactions in TON units.
 * Any excess fee will be returned to the user.
 */
export const TOKEN_TRANSFER_MAX_FEE = "0.1"; // 0.1 TON

/**
 * Minimum required balance in TON units.
 * This is the minimum balance required to perform transactions.
 */
export const MINIMUM_REQUIRED_BALANCE = "0.02"; // 0.02 TON

/**
 * Forward amount for token transfers in nanoTON units.
 */
export const TOKEN_TRANSFER_FORWARD_AMOUNT = 1; // 0.000000001 TON

/**
 * Maximum allowed bytes for a comment in a transaction.
 * Comments exceeding this limit will be considered invalid.
 */
export const MAX_COMMENT_BYTES = 120;

export enum JettonOpCode {
  Transfer = 0xf8a7ea5,
  TransferNotification = 0x7362d09c,
  InternalTransfer = 0x178d4519,
  Excesses = 0xd53276db,
  Burn = 0x595f07bc,
  BurnNotification = 0x7bdd97de,
}
