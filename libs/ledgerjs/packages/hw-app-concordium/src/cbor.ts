/**
 * CBOR encoding/decoding utilities for Concordium memos.
 *
 * Concordium memos must be CBOR-encoded text strings before transmission to the device.
 * The device firmware expects CBOR and decodes it for display during signing.
 *
 * This is a minimal CBOR implementation supporting only text strings (major type 3),
 * which is all that's needed for Concordium memos.
 * @private
 */

/** @private */
const CBOR_TEXT_STRING_BASE = 0x60;
/** @private */
const CBOR_MAX_SHORT_LENGTH = 24;
/** @private */
const CBOR_TEXT_STRING_1BYTE = 0x78;
/** @private */
const CBOR_TEXT_STRING_2BYTE = 0x79;

/**
 * Maximum memo length in bytes (UTF-8 encoded) before CBOR encoding.
 * The device firmware enforces a 256-byte limit on CBOR-encoded data.
 * CBOR text string encoding adds 2 bytes overhead for lengths 24-254,
 * so the maximum UTF-8 text is 254 bytes.
 */
export const MAX_MEMO_LENGTH = 254;

/**
 * Maximum CBOR-encoded memo size (including CBOR overhead).
 * This is the device firmware limit.
 */
export const MAX_CBOR_SIZE = 256;

/**
 * Encodes a memo string to CBOR text string format.
 *
 * Concordium memos must be CBOR-encoded before transmission to the device.
 * The device expects CBOR text strings and will decode them for display.
 *
 * CBOR text string encoding (major type 3):
 * - 0x60-0x77: lengths 0-23 (direct encoding, 1 byte overhead)
 * - 0x78 + length byte: lengths 24-254 (2 bytes overhead)
 * - 0x79 + 2 length bytes: lengths 255-65535 (3 bytes overhead, not supported for memos)
 *
 * @param memo - The memo string to encode (max 254 bytes UTF-8)
 * @returns Buffer containing CBOR-encoded text string
 * @throws Error if memo exceeds 254 bytes UTF-8
 */
export function encodeMemoToCbor(memo: string): Buffer {
  const memoBytes = Buffer.from(memo, "utf-8");
  const memoLength = memoBytes.length;

  if (memoLength > MAX_MEMO_LENGTH) {
    throw new Error(
      `Memo length ${memoLength} exceeds maximum of ${MAX_MEMO_LENGTH} bytes (UTF-8)`,
    );
  }

  let cborHeader: Buffer;

  if (memoLength < CBOR_MAX_SHORT_LENGTH) {
    // Short form: 0x60-0x77 (length 0-23)
    cborHeader = Buffer.from([CBOR_TEXT_STRING_BASE + memoLength]);
  } else {
    // 1-byte length form: 0x78 + 1 byte length (length 24-254)
    cborHeader = Buffer.from([CBOR_TEXT_STRING_1BYTE, memoLength]);
  }

  return Buffer.concat([cborHeader, memoBytes]);
}

/**
 * Decodes a CBOR-encoded memo string.
 *
 * The wallet-proxy and device return memos in CBOR-encoded format.
 * This function decodes them back to plain UTF-8 strings for display.
 *
 * Supports CBOR text string decoding:
 * - 0x60-0x77: lengths 0-23
 * - 0x78 + 1 byte: lengths 24-255
 * - 0x79 + 2 bytes: lengths 256-65535
 *
 * Note: While we only encode up to 254 bytes, we support decoding larger memos
 * that may come from wallet-proxy or other sources.
 *
 * If you have a hex or base64 encoded string, convert it to Buffer first:
 * - From hex: `Buffer.from(hexString, "hex")`
 * - From base64: `Buffer.from(base64String, "base64")`
 *
 * @param cborEncoded - CBOR-encoded memo as Buffer
 * @returns Decoded UTF-8 string
 */
export function decodeMemoFromCbor(cborEncoded: Buffer): string {
  if (cborEncoded.length === 0) {
    return "";
  }

  // Read CBOR header (first byte)
  const header = cborEncoded[0];
  let length: number;
  let dataStart: number;

  if (header >= CBOR_TEXT_STRING_BASE && header < CBOR_TEXT_STRING_BASE + CBOR_MAX_SHORT_LENGTH) {
    // Short form: 0x60-0x77 (length 0-23)
    length = header - CBOR_TEXT_STRING_BASE;
    dataStart = 1;
  } else if (header === CBOR_TEXT_STRING_1BYTE) {
    // 1-byte length form: 0x78 + 1 byte length
    if (cborEncoded.length < 2) {
      throw new Error("Invalid CBOR: insufficient data for 1-byte length");
    }
    length = cborEncoded[1];
    dataStart = 2;
  } else if (header === CBOR_TEXT_STRING_2BYTE) {
    // 2-byte length form: 0x79 + 2 bytes length (big-endian)
    if (cborEncoded.length < 3) {
      throw new Error("Invalid CBOR: insufficient data for 2-byte length");
    }
    length = cborEncoded.readUInt16BE(1);
    dataStart = 3;
  } else {
    throw new Error(
      `Invalid CBOR: expected text string (major type 3), got header byte 0x${header.toString(16)}`,
    );
  }

  // Validate we have enough data
  if (cborEncoded.length < dataStart + length) {
    throw new Error(
      `Invalid CBOR: insufficient data (expected ${dataStart + length} bytes, got ${cborEncoded.length})`,
    );
  }

  // Extract and decode the text data
  const textData = cborEncoded.subarray(dataStart, dataStart + length);
  return textData.toString("utf-8");
}
