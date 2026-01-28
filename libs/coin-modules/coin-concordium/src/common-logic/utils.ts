import {
  AccountAddress,
  DataBlob,
  getAccountTransactionHandler,
} from "@ledgerhq/concordium-sdk-adapter";
import type { AccountTransaction } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountTransactionWithEnergy } from "../types/transaction";

const CBOR_TEXT_STRING_BASE = 0x60;
const CBOR_MAX_SHORT_LENGTH = 24;
const CBOR_TEXT_STRING_1BYTE = 0x78;
const CBOR_TEXT_STRING_2BYTE = 0x79;

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
 * Supports CBOR text string encoding up to 254 bytes (to fit in 256-byte limit with CBOR overhead):
 * - 0x60-0x77: lengths 0-23 (direct encoding, +1 byte overhead)
 * - 0x78 + 1 byte: lengths 24-254 (+2 bytes overhead)
 *
 * Note: Device firmware and SDK DataBlob both enforce 256-byte limit on CBOR-encoded data.
 *
 * @param memo - The memo string to encode (max 254 bytes UTF-8)
 * @returns Buffer containing CBOR-encoded text string
 */
export function encodeMemoAsCbor(memo: string): Buffer {
  const memoBytes = Buffer.from(memo, "utf-8");
  const memoLength = memoBytes.length;

  let cborHeader: Buffer;

  if (memoLength < CBOR_MAX_SHORT_LENGTH) {
    // Short form: 0x60-0x77 (length 0-23)
    cborHeader = Buffer.from([CBOR_TEXT_STRING_BASE + memoLength]);
  } else if (memoLength <= 254) {
    // 1-byte length form: 0x78 + 1 byte length (length 24-254)
    cborHeader = Buffer.from([CBOR_TEXT_STRING_1BYTE, memoLength]);
  } else {
    throw new Error(`Memo length ${memoLength} exceeds maximum supported size of 254 bytes`);
  }

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
 * The wallet-proxy returns memos in CBOR-encoded format that needs to be decoded for display.
 *
 * Supports CBOR text string decoding:
 * - 0x60-0x77: lengths 0-23 (direct encoding)
 * - 0x78 + 1 byte: lengths 24-255
 * - 0x79 + 2 bytes (big-endian): lengths 256+ (for compatibility with network data)
 *
 * Note: While we only encode up to 254 bytes, we support decoding larger memos
 * for compatibility with transactions received from the network.
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
    let length: number;
    let dataOffset: number;

    if (header >= CBOR_TEXT_STRING_BASE && header < CBOR_TEXT_STRING_BASE + CBOR_MAX_SHORT_LENGTH) {
      // Short form: 0x60-0x77 (lengths 0-23)
      length = header - CBOR_TEXT_STRING_BASE;
      dataOffset = 1;
    } else if (header === CBOR_TEXT_STRING_1BYTE) {
      // 1-byte length form: 0x78 + 1 byte (lengths 24-255)
      if (buffer.length < 2) {
        return buffer.toString("utf-8");
      }
      length = buffer[1];
      dataOffset = 2;
    } else if (header === CBOR_TEXT_STRING_2BYTE) {
      // 2-byte length form: 0x79 + 2 bytes big-endian (length 256)
      if (buffer.length < 3) {
        return buffer.toString("utf-8");
      }
      length = (buffer[1] << 8) | buffer[2];
      dataOffset = 3;
    } else {
      // Not a recognized CBOR text string format, return as-is
      return buffer.toString("utf-8");
    }

    // Validate buffer has enough bytes for the data
    if (buffer.length < dataOffset + length) {
      return buffer.toString("utf-8");
    }

    // Extract and decode the UTF-8 string
    return buffer.subarray(dataOffset, dataOffset + length).toString("utf-8");
  } catch (_error) {
    // If any error occurs, return original input as string
    return typeof cborEncoded === "string" ? cborEncoded : cborEncoded.toString("utf-8");
  }
}
