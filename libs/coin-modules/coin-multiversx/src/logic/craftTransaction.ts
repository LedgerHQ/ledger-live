import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/types";

import {
  CHAIN_ID,
  GAS,
  GAS_PRICE,
  MIN_GAS_LIMIT,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
} from "../constants";
import type { CraftTransactionInput, MultiversXTransactionMode } from "../types";

/**
 * Validates a MultiversX address format (bech32 with erd1 prefix).
 * @param address - Address to validate
 * @returns true if valid, false otherwise
 */
function isValidMultiversXAddress(address: string): boolean {
  // MultiversX addresses are bech32 encoded with erd1 prefix, 62 characters total
  return typeof address === "string" && address.startsWith("erd1") && address.length === 62;
}

/**
 * Encodes an ESDT transfer data field.
 * Format: ESDTTransfer@{tokenIdentifierHex}@{amountHex}
 * @param tokenIdentifier - The ESDT token identifier (e.g., "USDC-abc123")
 * @param amount - The amount to transfer as bigint
 * @returns Base64-encoded data string
 */
function encodeEsdtTransferData(tokenIdentifier: string, amount: bigint): string {
  // Convert token identifier to hex
  const tokenHex = Buffer.from(tokenIdentifier).toString("hex");

  // Convert amount to hex with even-length padding
  let amountHex = amount.toString(16);
  if (amountHex.length % 2 !== 0) {
    amountHex = "0" + amountHex;
  }
  // Handle zero case
  if (amountHex === "" || amountHex === "0") {
    amountHex = "00";
  }

  // Build the data string
  const dataString = `ESDTTransfer@${tokenHex}@${amountHex}`;

  // Encode to base64
  return Buffer.from(dataString).toString("base64");
}

/**
 * Encodes unDelegate data field with amount in hex.
 * Format: unDelegate@{amountHex}
 * CRITICAL: Hex amount MUST have even length per MultiversX protocol.
 * Note: Zero amount (0n) produces "unDelegate@00" which is valid.
 * @param amount - The amount to undelegate as bigint
 * @returns Base64-encoded data string
 */
function encodeUnDelegateData(amount: bigint): string {
  let amountHex = amount.toString(16);
  // CRITICAL: hex amount length must be even
  if (amountHex.length % 2 !== 0) {
    amountHex = "0" + amountHex;
  }
  // Zero amount produces empty string, ensure it becomes "00"
  if (amountHex === "" || amountHex === "0") {
    amountHex = "00";
  }
  return Buffer.from(`unDelegate@${amountHex}`).toString("base64");
}

/**
 * Gets the default gas limit for a transaction mode.
 * @param mode - The transaction mode
 * @param isEsdtTransfer - Whether this is an ESDT token transfer
 * @returns The default gas limit
 * @internal Exported for use in API layer to avoid code duplication
 */
export function getDefaultGasLimit(mode: MultiversXTransactionMode, isEsdtTransfer: boolean): number {
  // ESDT transfers have their own gas limit
  if (isEsdtTransfer) {
    return GAS.ESDT_TRANSFER;
  }

  // Delegation modes
  if (mode === "delegate" || mode === "unDelegate") {
    return GAS.DELEGATE; // 75,000,000
  }
  if (mode === "claimRewards" || mode === "withdraw" || mode === "reDelegateRewards") {
    return GAS.CLAIM; // 6,000,000
  }

  // Native EGLD transfer
  return MIN_GAS_LIMIT; // 50,000
}

/**
 * Crafts an unsigned transaction for native EGLD, ESDT token transfer, or delegation operations.
 * Builds a MultiversXProtocolTransaction structure ready for hardware wallet signing.
 *
 * Supported modes:
 * - "send": Native EGLD or ESDT token transfer
 * - "delegate": Delegate EGLD to a validator
 * - "unDelegate": Undelegate EGLD from a validator
 * - "withdraw": Withdraw unbonded EGLD
 * - "claimRewards": Claim staking rewards
 * - "reDelegateRewards": Re-delegate rewards to validator
 *
 * @param input - Transaction input parameters
 * @returns Crafted transaction with serialized JSON transaction string
 * @throws Error if input validation fails (invalid address, negative amount/nonce)
 */
export function craftTransaction(input: CraftTransactionInput): CraftedTransaction {
  const { sender, recipient, amount, nonce, gasLimit, mode, tokenIdentifier } = input;

  // Input validation (ADR-003)
  if (!isValidMultiversXAddress(sender)) {
    throw new Error("craftTransaction failed: invalid sender address format");
  }
  if (!isValidMultiversXAddress(recipient)) {
    throw new Error("craftTransaction failed: invalid recipient address format");
  }
  if (amount < 0n) {
    throw new Error("craftTransaction failed: amount cannot be negative");
  }
  if (nonce < 0) {
    throw new Error("craftTransaction failed: nonce cannot be negative");
  }

  // Determine if this is an ESDT transfer
  const isEsdtTransfer = tokenIdentifier !== undefined && tokenIdentifier.length > 0;

  // Determine transaction value and data based on mode
  let value: string;
  let data: string | undefined;

  switch (mode) {
    case "delegate":
      // Delegate: value carries the EGLD amount, data is base64("delegate")
      value = amount.toString();
      data = Buffer.from("delegate").toString("base64");
      break;

    case "unDelegate":
      // UnDelegate: value is "0", amount encoded in data field
      value = "0";
      data = encodeUnDelegateData(amount);
      break;

    case "withdraw":
      // Withdraw: value is "0", data is base64("withdraw")
      value = "0";
      data = Buffer.from("withdraw").toString("base64");
      break;

    case "claimRewards":
      // ClaimRewards: value is "0", data is base64("claimRewards")
      value = "0";
      data = Buffer.from("claimRewards").toString("base64");
      break;

    case "reDelegateRewards":
      // ReDelegateRewards: value is "0", data is base64("reDelegateRewards")
      value = "0";
      data = Buffer.from("reDelegateRewards").toString("base64");
      break;

    case "send":
    default:
      // Native EGLD or ESDT transfer
      if (isEsdtTransfer) {
        if (!tokenIdentifier || tokenIdentifier.length === 0) {
          throw new Error("craftTransaction failed: tokenIdentifier is required for ESDT transfers");
        }
        value = "0"; // ESDT transfers have value "0"
        data = encodeEsdtTransferData(tokenIdentifier, amount);
      } else {
        value = amount.toString();
        data = undefined;
      }
      break;
  }

  // Build the transaction object matching MultiversXProtocolTransaction structure
  const transaction: Record<string, unknown> = {
    nonce,
    value,
    receiver: recipient,
    sender,
    gasPrice: GAS_PRICE,
    gasLimit: gasLimit ?? getDefaultGasLimit(mode, isEsdtTransfer),
    chainID: CHAIN_ID,
    version: TRANSACTION_VERSION_DEFAULT,
    options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
  };

  // Add data field if present
  if (data !== undefined) {
    transaction.data = data;
  }

  // Serialize to JSON for hardware wallet signing
  const serialized = JSON.stringify(transaction);

  return {
    transaction: serialized,
  };
}
