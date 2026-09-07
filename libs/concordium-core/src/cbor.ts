/**
 * CBOR encoding/decoding utilities.
 *
 * Two groups, in order:
 *
 * - The CCD memo helpers. A memo is a CBOR text string, and the device decodes
 *   it for display during signing.
 * - Generic CBOR primitives (RFC 8949), added for Protocol-Level Token payloads,
 *   which are structured CBOR rather than a single text string.
 *
 * This is a hand-rolled encoder covering only what those two flows need, not a
 * general-purpose CBOR library. It has no decoder beyond the memo one.
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
 * Maximum CCD memo length in bytes (UTF-8 encoded) before CBOR encoding.
 * The device firmware enforces a 256-byte limit on an encoded CCD memo.
 * CBOR text string encoding adds 2 bytes overhead for lengths 24-254,
 * so the maximum UTF-8 text is 254 bytes.
 */
export const MAX_MEMO_LENGTH = 254;

/**
 * Maximum CBOR-encoded memo size (including CBOR overhead).
 *
 * This is the CCD memo limit (`MAX_CBOR_BLOB_SIZE` in the device app), not a
 * global CBOR limit. PLT payloads have their own, larger budget — see
 * {@link PLT_CBOR_MAX_SIZE}.
 */
export const MAX_CBOR_SIZE = 256;

/**
 * Maximum PLT CBOR operations blob the device will buffer.
 *
 * Mirrors `APP_PLT_CBOR_MAX` in the device app. Distinct from
 * {@link MAX_CBOR_SIZE}, which is the CCD memo limit.
 */
export const PLT_CBOR_MAX_SIZE = 512;

/**
 * Inclusive bounds on a PLT token id, in bytes.
 *
 * Mirrors `PLT_TOKEN_ID_MAX` in the device app and CIS-7 §3.
 */
export const PLT_TOKEN_ID_MIN_LENGTH = 1;
export const PLT_TOKEN_ID_MAX_LENGTH = 128;

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
 * Returns the CBOR-encoded byte length of a memo string without allocating.
 *
 * Equivalent to `encodeMemoToCbor(memo).length` but without the Buffer allocation,
 * useful for size checks before encoding.
 *
 * @param memo - The memo string (UTF-8)
 * @returns Total byte length after CBOR encoding
 */
export function memoEncodedSize(memo: string): number {
  const memoBytes = Buffer.byteLength(memo, "utf-8");
  const cborOverhead = memoBytes < CBOR_MAX_SHORT_LENGTH ? 1 : 2;
  return memoBytes + cborOverhead;
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

/*
 * Generic CBOR primitives (RFC 8949).
 *
 * Added for Protocol-Level Token (PLT) payloads, which are structured CBOR
 * rather than the single text string a CCD memo needs. Every encoder below
 * emits the shortest possible head. Neither the device nor the chain requires
 * that on decode, but it is what makes our output reproducible and
 * byte-comparable against the chain's own deterministic encoder.
 */

/**
 * CBOR major types, pre-shifted into the head byte's high three bits: each
 * value is `majorType << 5`.
 * @private
 */
const CborMajor = {
  Unsigned: 0x00,
  Negative: 0x20,
  ByteString: 0x40,
  TextString: 0x60,
  Array: 0x80,
  Map: 0xa0,
  Tag: 0xc0,
} as const;

/** @private */
type CborMajor = (typeof CborMajor)[keyof typeof CborMajor];

/**
 * Encodes a CBOR head: the major type plus an argument, using the shortest
 * form that fits.
 * @private
 */
function encodeCborHead(major: CborMajor, argument: bigint): Buffer {
  if (argument < 0n) {
    throw new Error(`CBOR argument must be non-negative, got ${argument}`);
  }

  if (argument < 24n) {
    return Buffer.from([major | Number(argument)]);
  }
  if (argument <= 0xffn) {
    return Buffer.from([major | 24, Number(argument)]);
  }
  if (argument <= 0xffffn) {
    const buf = Buffer.alloc(3);
    buf.writeUInt8(major | 25, 0);
    buf.writeUInt16BE(Number(argument), 1);
    return buf;
  }
  if (argument <= 0xffffffffn) {
    const buf = Buffer.alloc(5);
    buf.writeUInt8(major | 26, 0);
    buf.writeUInt32BE(Number(argument), 1);
    return buf;
  }
  if (argument <= 0xffffffffffffffffn) {
    const buf = Buffer.alloc(9);
    buf.writeUInt8(major | 27, 0);
    buf.writeBigUInt64BE(argument, 1);
    return buf;
  }

  throw new Error(`CBOR argument exceeds 64 bits: ${argument}`);
}

/**
 * Rejects a `number` that cannot represent the caller's intent exactly.
 *
 * A literal beyond 2^53 is already rounded by the time it reaches here, so
 * encoding it would silently emit a different value. Callers needing the full
 * 64-bit range must pass a `bigint`.
 * @private
 */
function toExactBigInt(value: bigint | number): bigint {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new TypeError(`CBOR integer ${value} is not a safe JavaScript integer; pass a bigint`);
  }
  return BigInt(value);
}

/**
 * Encodes an unsigned integer (major type 0).
 *
 * @param value Non-negative integer, up to 2^64 - 1. Values above 2^53 must be `bigint`.
 */
export function encodeCborUnsigned(value: bigint | number): Buffer {
  return encodeCborHead(CborMajor.Unsigned, toExactBigInt(value));
}

/**
 * Encodes a negative integer (major type 1).
 *
 * CBOR stores -1 - n, so -1 encodes as argument 0.
 *
 * @param value Negative integer, down to -2^64
 */
export function encodeCborNegative(value: bigint | number): Buffer {
  const asBigInt = toExactBigInt(value);
  if (asBigInt >= 0n) {
    throw new Error(`Expected a negative integer, got ${asBigInt}`);
  }
  return encodeCborHead(CborMajor.Negative, -asBigInt - 1n);
}

/**
 * Encodes an integer of either sign, picking major type 0 or 1.
 */
export function encodeCborInteger(value: bigint | number): Buffer {
  const asBigInt = toExactBigInt(value);
  return asBigInt < 0n ? encodeCborNegative(asBigInt) : encodeCborUnsigned(asBigInt);
}

/**
 * Encodes a byte string (major type 2).
 */
export function encodeCborByteString(value: Buffer): Buffer {
  return Buffer.concat([encodeCborHead(CborMajor.ByteString, BigInt(value.length)), value]);
}

/**
 * Encodes a UTF-8 text string (major type 3).
 *
 * Distinct from {@link encodeMemoToCbor}, which is the CCD memo helper and
 * carries that flow's length limit.
 */
export function encodeCborTextString(value: string): Buffer {
  const bytes = Buffer.from(value, "utf-8");
  return Buffer.concat([encodeCborHead(CborMajor.TextString, BigInt(bytes.length)), bytes]);
}

/**
 * Encodes a definite-length array (major type 4) from already-encoded items.
 */
export function encodeCborArray(items: Buffer[]): Buffer {
  return Buffer.concat([encodeCborHead(CborMajor.Array, BigInt(items.length)), ...items]);
}

/**
 * Encodes a definite-length map (major type 5) from already-encoded entries.
 *
 * Entries are emitted in the order given. Callers that need deterministic
 * output must pass them already ordered; this function does not sort, because
 * CIS-7 maps are keyed on both integers and strings and the callers know their
 * own canonical order.
 */
export function encodeCborMap(entries: [Buffer, Buffer][]): Buffer {
  const flattened = entries.flatMap(([key, value]) => [key, value]);
  return Buffer.concat([encodeCborHead(CborMajor.Map, BigInt(entries.length)), ...flattened]);
}

/**
 * Wraps an already-encoded value in a semantic tag (major type 6).
 *
 * @param tag Tag number, up to 2^64 - 1. Values above 2^53 must be `bigint`.
 */
export function encodeCborTag(tag: bigint | number, value: Buffer): Buffer {
  return Buffer.concat([encodeCborHead(CborMajor.Tag, toExactBigInt(tag)), value]);
}

/**
 * Encodes a definite-length map with keys in bytewise lexicographic order of
 * their encoded form.
 *
 * This is the deterministic encoding the chain itself emits, so our output is
 * byte-identical to what the chain produces. For short text keys it coincides
 * with RFC 8949 canonical ordering, because the length lives in the head byte:
 * `"memo"` (`0x64…`) sorts before `"amount"` (`0x66…`) before `"recipient"`
 * (`0x69…`).
 */
export function encodeCborMapDeterministic(entries: [Buffer, Buffer][]): Buffer {
  const sorted = [...entries].sort(([a], [b]) => Buffer.compare(a, b));

  for (let i = 1; i < sorted.length; i++) {
    if (Buffer.compare(sorted[i - 1][0], sorted[i][0]) === 0) {
      throw new Error("CBOR map contains a duplicate key");
    }
  }

  return encodeCborMap(sorted);
}
