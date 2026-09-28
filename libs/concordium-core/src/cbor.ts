/**
 * CBOR encoding/decoding utilities.
 *
 * Two groups, after the major-type table they share:
 *
 * - The memo helpers, used by CCD and PLT transfers alike. A memo is a single
 *   CBOR value — a text string as written by this package, or an integer from
 *   another sender.
 * - Generic CBOR primitives (RFC 8949), added for Protocol-Level Token payloads,
 *   which are structured CBOR rather than a single value.
 *
 * This is a hand-rolled encoder covering only what those two flows need, not a
 * general-purpose CBOR library. It has no decoder beyond the memo one.
 * @private
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

/** @private */
const CBOR_TEXT_STRING_BASE = 0x60;
/** @private */
const CBOR_MAX_SHORT_LENGTH = 24;
/** @private */
const CBOR_TEXT_STRING_1BYTE = 0x78;

/**
 * Maximum memo length in bytes (UTF-8 encoded) before CBOR encoding.
 *
 * Applies to both transfer kinds. The chain caps the CBOR *value* at
 * {@link MAX_CBOR_SIZE}, and a text string costs 2 bytes of header for lengths
 * 24-254, so 254 bytes of text encodes to exactly 256 — the largest that fits.
 *
 * The PLT path's tag-24 byte-string envelope is outside that cap.
 * `decodeTaggableMemo` in the node consumes the tag, then measures only the
 * byte string it wraps (`Types/ProtocolLevelTokens/CBOR.hs:747-762`), so the
 * envelope's 5 bytes count against the operations blob's own budget instead —
 * see {@link PLT_CBOR_MAX_SIZE}.
 */
export const MAX_MEMO_LENGTH = 254;

/**
 * Maximum CBOR-encoded memo size, header included.
 *
 * The chain's `Memo` caps itself here, whichever transfer carries it, and
 * measures the CBOR value alone — not the PLT path's tag-24 envelope around it.
 * Not a global CBOR limit: a PLT operations blob has its own, larger budget —
 * see {@link PLT_CBOR_MAX_SIZE}.
 */
export const MAX_CBOR_SIZE = 256;

/**
 * Maximum PLT CBOR operations blob the device will buffer.
 *
 * Mirrors `APP_PLT_CBOR_MAX` in the device app. Distinct from
 * {@link MAX_CBOR_SIZE}, which bounds the memo inside the blob.
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
 * Every memo this package writes goes through here, whichever transfer carries
 * it. The CCD signing screen decodes the value before displaying it. The PLT
 * screen does not yet — `parse_memo_value` in the device app unwraps tag 24 and
 * renders the content bytes verbatim — so a PLT memo reads as its CBOR header
 * plus its text on screen until the device app decodes it too.
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

/** @private */
const CBOR_ARGUMENT_WIDTHS: Record<number, number> = { 24: 1, 25: 2, 26: 4, 27: 8 };

/**
 * Reads a CBOR head byte's argument: the value packed into its low five bits, or
 * the 1, 2, 4 or 8 bytes that follow.
 *
 * `what` names the argument in the error message, so a truncated text string
 * still reports a length and a truncated integer reports a value.
 *
 * @private
 */
function readCborArgument(
  buf: Buffer,
  offset: number,
  what: string,
): { value: bigint; next: number } {
  const additional = buf[offset] & 0x1f;
  if (additional < CBOR_MAX_SHORT_LENGTH) return { value: BigInt(additional), next: offset + 1 };

  const width = CBOR_ARGUMENT_WIDTHS[additional];
  if (width === undefined) {
    // 28-30 are reserved. 31 is the indefinite-length form, which the device
    // also refuses — `parse_complete_cbor` gates on `cbor_value_is_length_known`.
    throw new Error(`Invalid CBOR: unsupported additional information ${additional}`);
  }
  if (buf.length < offset + 1 + width) {
    throw new Error(`Invalid CBOR: insufficient data for ${width}-byte ${what}`);
  }

  let value = 0n;
  for (let i = 0; i < width; i++) value = (value << 8n) | BigInt(buf[offset + 1 + i]);
  return { value, next: offset + 1 + width };
}

/**
 * Decodes UTF-8, rejecting what `toString` would silently replace.
 *
 * RFC 8949 §3.1 requires a text string's content to be valid UTF-8, but
 * `Buffer.toString("utf-8")` substitutes U+FFFD rather than failing, and a memo
 * is sender-controlled — so without this a sender puts replacement characters
 * on screen. Round-tripping is the check: valid UTF-8 re-encodes to the bytes
 * it came from.
 *
 * @private
 */
function decodeUtf8Strictly(bytes: Buffer): string {
  const text = bytes.toString("utf-8");
  if (!Buffer.from(text, "utf-8").equals(bytes)) {
    throw new Error("Invalid CBOR: text string is not valid UTF-8");
  }

  return text;
}

/**
 * Requires the decoded value to be the whole buffer rather than a prefix of it.
 *
 * Without this, `6162` decodes to `"b"` — the first byte read as a
 * one-character header — so raw bytes that happen to agree with their own
 * length would silently yield a shortened memo. The device enforces the same
 * rule, comparing the parser's position against the end of its buffer.
 *
 * @private
 */
function requireWholeBuffer(buf: Buffer, end: number): void {
  if (buf.length > end) {
    throw new Error(`Invalid CBOR: ${buf.length - end} trailing byte(s) after the value`);
  }
}

/**
 * Decodes a CBOR-encoded memo for display.
 *
 * Reads the three major types the device's CCD signing screen renders, so a CCD
 * memo in history is what the user could have approved:
 *
 * - text string (major 3), returned as its UTF-8 text
 * - unsigned integer (major 0) and negative integer (major 1), returned as a
 *   decimal string
 *
 * Any other major type is rejected, as are the indefinite-length form, the
 * reserved additional-info values, and a text string whose content is not valid
 * UTF-8. This package only ever writes text strings; the integers exist because
 * another sender may have written one.
 *
 * Pass `allowIntegers: false` where the caller falls back to reading the bytes
 * as raw text. An integer's head byte collides with common text: `"0"` through
 * `"7"` are `0x30`-`0x37`, which is major type 1, so a single-digit payment
 * reference would decode to `-17` through `-24` instead of falling through. Only
 * a caller that treats a decode failure as final can afford the integers.
 *
 * The value must consume the whole buffer, so a memo carrying anything after it
 * is rejected rather than read as a prefix. Even so, text and CBOR cannot always
 * be separated: `"ab"` is also a complete one-character text string holding
 * `"b"`.
 *
 * Decodes memos longer than this package will encode, since the 254-byte cap is
 * ours and the proxy reports whatever the sender wrote.
 *
 * If you have a hex or base64 encoded string, convert it to Buffer first:
 * - From hex: `Buffer.from(hexString, "hex")`
 * - From base64: `Buffer.from(base64String, "base64")`
 *
 * @param cborEncoded - CBOR-encoded memo as Buffer
 * @param options.allowIntegers - Whether to read major types 0 and 1; see above
 * @returns The text, or an integer rendered in decimal
 * @throws If the value is not one of the three supported types, is truncated,
 * does not fill the buffer, or is a text string that is not valid UTF-8
 */
export function decodeMemoFromCbor(
  cborEncoded: Buffer,
  { allowIntegers = true }: { allowIntegers?: boolean } = {},
): string {
  if (cborEncoded.length === 0) {
    return "";
  }

  const major = cborEncoded[0] & 0xe0;

  if (allowIntegers && (major === CborMajor.Unsigned || major === CborMajor.Negative)) {
    const { value, next } = readCborArgument(cborEncoded, 0, "value");
    requireWholeBuffer(cborEncoded, next);
    // Major type 1 encodes -1 - n, so its smallest value is -(2^64). The device
    // renders that one as "-18446744073709551615 - 1", having no integer wide
    // enough to hold it; BigInt prints it exactly.
    return (major === CborMajor.Unsigned ? value : -1n - value).toString();
  }

  if (major !== CborMajor.TextString) {
    throw new Error(
      `Invalid CBOR: expected a text string${allowIntegers ? " or integer" : ""}, got header byte 0x${cborEncoded[0].toString(16)}`,
    );
  }

  const { value, next } = readCborArgument(cborEncoded, 0, "length");
  const length = Number(value);

  if (cborEncoded.length < next + length) {
    throw new Error(
      `Invalid CBOR: insufficient data (expected ${next + length} bytes, got ${cborEncoded.length})`,
    );
  }
  requireWholeBuffer(cborEncoded, next + length);

  return decodeUtf8Strictly(cborEncoded.subarray(next, next + length));
}

/*
 * Generic CBOR primitives (RFC 8949).
 *
 * Added for Protocol-Level Token (PLT) payloads, which are structured CBOR
 * rather than the single value a memo holds. Every encoder below
 * emits the shortest possible head. Neither the device nor the chain requires
 * that on decode, but it is what makes our output reproducible and
 * byte-comparable against the chain's own deterministic encoder.
 */

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
 * Distinct from {@link encodeMemoToCbor}, which is the memo helper and
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
