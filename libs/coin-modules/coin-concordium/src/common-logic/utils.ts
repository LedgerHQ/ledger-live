import {
  AccountAddress,
  DataBlob,
  getAccountTransactionHandler,
} from "@ledgerhq/concordium-sdk-adapter";
import type { AccountTransaction } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountTransactionWithEnergy } from "../types/transaction";

const CBOR_TEXT_STRING_BASE = 0x60;
const CBOR_MAX_SHORT_LENGTH = 24;

/**
 * Validates a Concordium account address using the SDK.
 * Checks that the address is exactly 50 characters, valid base58check encoding, and uses version byte 1.
 */
export function isRecipientValid(recipient: string): boolean {
  try {
    AccountAddress.fromBase58(recipient);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encodes a signed Concordium transaction as JSON for storage in signed operations.
 * The encoded format is later parsed by broadcast() to submit to wallet-proxy.
 * Returns a JSON string with separate transaction body and signature.
 */
export const encodeSignedTransaction = (transaction: string, signature: string) => {
  return JSON.stringify({
    transactionBody: transaction,
    signature: signature,
  });
};

export function transformAccountTransaction(
  sdkTx: AccountTransactionWithEnergy,
): AccountTransaction {
  const handler = getAccountTransactionHandler(sdkTx.type);
  const serializedPayload = handler.serialize(sdkTx.payload);

  return {
    sender: Buffer.from(AccountAddress.toBuffer(sdkTx.header.sender)),
    nonce: sdkTx.header.nonce.value,
    expiry: sdkTx.header.expiry.expiryEpochSeconds,
    energyAmount: sdkTx.energyAmount,
    transactionType: sdkTx.type,
    payload: Buffer.from(serializedPayload),
  };
}

/**
 * Encodes a string as a CBOR text string.
 * Memos in Concordium TransferWithMemo transactions must be CBOR-encoded.
 * The Ledger device expects CBOR-encoded memos for display and signing.
 *
 * @param memo - The memo string to encode
 * @returns Buffer containing CBOR-encoded text string
 */
export function encodeMemoAsCbor(memo: string): Buffer {
  const memoBytes = Buffer.from(memo, "utf-8");
  const memoLength = memoBytes.length;

  if (memoLength >= CBOR_MAX_SHORT_LENGTH) {
    throw new Error(`Memo length must be less than ${CBOR_MAX_SHORT_LENGTH} bytes`);
  }

  const cborHeader = Buffer.from([CBOR_TEXT_STRING_BASE + memoLength]);
  return Buffer.concat([cborHeader, memoBytes]);
}

/**
 * Converts a Buffer to SDK DataBlob format.
 * The SDK's TransferWithMemo handler requires memo as DataBlob, not raw Buffer.
 *
 * @param buffer - Buffer to convert
 * @returns DataBlob instance for SDK serialization
 */
export function bufferToDataBlob(buffer: Buffer): DataBlob {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  new Uint8Array(arrayBuffer).set(buffer);
  return new DataBlob(arrayBuffer);
}

/**
 * Encodes a memo string to SDK DataBlob format.
 * Combines CBOR encoding and DataBlob conversion in one step.
 *
 * @param memo - The memo string to encode
 * @returns DataBlob instance ready for SDK TransferWithMemo payload
 */
export function encodeMemoToDataBlob(memo: string): DataBlob {
  const cborEncoded = encodeMemoAsCbor(memo);
  return bufferToDataBlob(cborEncoded);
}

/**
 * Decodes a CBOR-encoded memo string.
 * Reverses the encoding done by encodeMemoAsCbor.
 * The wallet-proxy returns memos in CBOR-encoded format that needs to be decoded for display.
 *
 * @param cborEncoded - CBOR-encoded memo (can be string hex, Buffer, or base64)
 * @returns Decoded UTF-8 string, or original input if decoding fails
 */
export function decodeMemoFromCbor(cborEncoded: string | Buffer): string {
  try {
    // Convert input to Buffer if it's a string
    let buffer: Buffer;
    if (typeof cborEncoded === "string") {
      // Try hex first, then base64 as fallback
      buffer = cborEncoded.match(/^[0-9a-fA-F]+$/)
        ? Buffer.from(cborEncoded, "hex")
        : Buffer.from(cborEncoded, "base64");
    } else {
      buffer = cborEncoded;
    }

    if (buffer.length === 0) {
      return "";
    }

    // Read CBOR header (first byte)
    const header = buffer[0];

    // Check if it's a CBOR text string (0x60-0x77 range for short strings)
    if (header < CBOR_TEXT_STRING_BASE || header >= CBOR_TEXT_STRING_BASE + CBOR_MAX_SHORT_LENGTH) {
      // Not a valid CBOR short text string, return as-is
      return buffer.toString("utf-8");
    }

    // Extract length from header
    const length = header - CBOR_TEXT_STRING_BASE;

    // Validate buffer has enough bytes
    if (buffer.length < length + 1) {
      return buffer.toString("utf-8");
    }

    // Extract and decode the UTF-8 string
    return buffer.subarray(1, 1 + length).toString("utf-8");
  } catch (_error) {
    // If any error occurs, return original input as string
    return typeof cborEncoded === "string" ? cborEncoded : cborEncoded.toString("utf-8");
  }
}
