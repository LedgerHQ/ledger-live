/**
 * CIS-7 Protocol-Level Token (PLT) payload encoding.
 *
 * A `TokenUpdate` transaction carries a token id and a CBOR-encoded list of
 * token operations. The wallet only ever emits a single `transfer`.
 *
 * Two independent consumers constrain the output: the chain, which defines the
 * canonical wire format, and the Ledger device, which is stricter in places. The
 * tighter of the two bounds wins. Checks live here where the value is built; the
 * single-operation check is in `serializeTokenUpdate`, which sees the blob.
 */

import type { AccountAddress } from "./address";
import {
  encodeCborArray,
  encodeCborByteString,
  encodeCborInteger,
  encodeCborMapDeterministic,
  encodeCborTag,
  encodeCborTextString,
  encodeCborUnsigned,
  encodeMemoToCbor,
  MAX_MEMO_LENGTH,
  PLT_CBOR_MAX_SIZE,
} from "./cbor";

/**
 * CBOR tag for a decimal fraction, `[exponent, significand]` (RFC 8949 §3.4.4).
 * CIS-7 uses it for token amounts.
 */
const CBOR_TAG_DECIMAL_FRACTION = 4;

/**
 * CBOR tag marking a byte string as embedded CBOR (RFC 8949 §3.4.5.1).
 *
 * The chain's `CborMemo` is discriminated by it: tagged means the byte string
 * holds CBOR, untagged means it holds raw bytes. See {@link encodePltMemo}.
 */
const CBOR_TAG_EMBEDDED_CBOR = 24;

/** CBOR tag for a `tagged-coininfo` (BCR-2020-007). */
const CBOR_TAG_COININFO = 40305;

/** CBOR tag for a `tagged-address` (BCR-2020-009). */
const CBOR_TAG_ADDRESS = 40307;

/** Map key inside a `tagged-coininfo`: the SLIP-44 coin type. */
const COININFO_KEY_TYPE = 1;

/** Map keys inside a `tagged-address`: optional coin info, and the address bytes. */
const ADDRESS_KEY_INFO = 1;
const ADDRESS_KEY_DATA = 3;

/** SLIP-44 coin type for CCD, the only value CIS-7 permits in a coin info. */
const CCD_COIN_TYPE = 919;

/** Largest significand a token amount can carry: an unsigned 64-bit integer. */
const MAX_SIGNIFICAND = 2n ** 64n - 1n;

/**
 * Largest number of decimals a PLT amount may carry.
 *
 * The chain accepts up to 255. Two device limits are tighter, and this is the
 * tighter of those two: the app rejects an amount whose exponent magnitude
 * exceeds 18 with `0x6B11 ERROR_PLT_UNSUPPORTED_DECIMALS`. The CBOR encoding
 * imposes a separate ceiling of 128 — the exponent is a signed byte, so a raw
 * negative-integer argument above 127 does not fit — but a payload can satisfy
 * that and still be refused for its decimals.
 *
 * A token declaring more than 18 decimals is therefore legal on chain and
 * unsignable on Ledger. Rejecting it here keeps the encoder from building a
 * payload the device will refuse; LIVE-28334 rejects it earlier still, in
 * transaction status, so the user learns before plugging in.
 */
export const PLT_MAX_DECIMALS = 18;

/**
 * A PLT transfer, in the terms the wallet holds it.
 */
export interface PltTransfer {
  /** Recipient account. */
  recipient: AccountAddress;
  /**
   * Amount in the token's smallest unit, as an unsigned 64-bit integer. Paired
   * with `decimals`, this is the decimal fraction the chain executes.
   */
  amount: bigint;
  /**
   * The token's decimal places, 0 to 128.
   *
   * Must equal the token's registered decimals. The chain compares the two and
   * rejects a mismatch with `deserializationFailure` rather than rescaling, and
   * this package cannot check it — CAL is the source of truth and lives in the
   * coin module. Callers must pass the CAL unit magnitude, not a guess.
   */
  decimals: number;
  /**
   * Optional memo, as the text the user typed, at most {@link MAX_MEMO_LENGTH}
   * bytes of UTF-8. Encoded exactly as a CCD memo is — see
   * {@link encodePltMemo} for the envelope the two do not share.
   *
   * Absent and empty are distinct: omitting the field emits no memo, while `""`
   * emits an empty text string. Callers that treat empty as absent must omit
   * the field.
   */
  memo?: string;
  /**
   * Emit the optional coin info alongside the recipient address. Off by default:
   * its absence means "a Concordium address" to both the chain and the device,
   * and omitting it saves 9 bytes of the PLT CBOR budget.
   */
  includeCoinInfo?: boolean;
}

/**
 * Encodes a CIS-7 token amount: `tag 4([exponent, significand])`.
 *
 * The exponent is the negated decimals, so it is always `<= 0`. Both the device
 * and the chain reject a positive exponent.
 *
 * @throws If `amount` is negative or exceeds 64 bits, or `decimals` is outside
 * 0..{@link PLT_MAX_DECIMALS}
 */
export function encodePltAmount(amount: bigint, decimals: number): Buffer {
  if (amount < 0n) {
    throw new Error(`PLT amount must not be negative, got ${amount}`);
  }
  if (amount > MAX_SIGNIFICAND) {
    throw new Error(`PLT amount ${amount} exceeds the unsigned 64-bit range`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > PLT_MAX_DECIMALS) {
    throw new Error(`PLT decimals must be an integer in 0..${PLT_MAX_DECIMALS}, got ${decimals}`);
  }

  return encodeCborTag(
    CBOR_TAG_DECIMAL_FRACTION,
    encodeCborArray([encodeCborInteger(-decimals), encodeCborUnsigned(amount)]),
  );
}

/**
 * Encodes a CIS-7 account address: `tag 40307({? 1: tag 40305({1: 919}), 3: bstr(32)})`.
 *
 * The map is not optional: the chain rejects a bare byte string inside the tag.
 */
export function encodePltAddress(address: AccountAddress, includeCoinInfo = false): Buffer {
  const entries: [Buffer, Buffer][] = [
    [encodeCborUnsigned(ADDRESS_KEY_DATA), encodeCborByteString(address.toBuffer())],
  ];

  if (includeCoinInfo) {
    entries.push([
      encodeCborUnsigned(ADDRESS_KEY_INFO),
      encodeCborTag(
        CBOR_TAG_COININFO,
        encodeCborMapDeterministic([
          [encodeCborUnsigned(COININFO_KEY_TYPE), encodeCborUnsigned(CCD_COIN_TYPE)],
        ]),
      ),
    ]);
  }

  return encodeCborTag(CBOR_TAG_ADDRESS, encodeCborMapDeterministic(entries));
}

/**
 * Encodes a CIS-7 memo: `tag 24(byte string(CBOR text string))`.
 *
 * The chain models this field as `CborMemo`, a two-variant union discriminated
 * by the tag — an untagged byte string declares that its content is *not* CBOR,
 * and tag 24 (RFC 8949 "encoded CBOR data item") declares that it is. The
 * content here is a CBOR text string, so the tag is required rather than
 * optional: emitting the same bytes untagged would claim the opposite.
 *
 * The content is produced by {@link encodeMemoToCbor}, the same function the CCD
 * path uses. Both carry a CBOR-encoded value in the chain's `Memo` type under
 * the same 256-byte cap; only the envelope differs, which is why this wrapper
 * exists and the codec does not.
 *
 * The cap measures that value, not this envelope: a full-length memo encodes to
 * 256 bytes of text string and 261 with the wrapper, and the node checks the
 * former. Those 5 bytes count against {@link PLT_CBOR_MAX_SIZE} instead.
 *
 * The device app unwraps the tag but does not yet decode the content, so its
 * signing screen renders these bytes rather than the text until it does.
 *
 * @throws If the memo exceeds {@link MAX_MEMO_LENGTH} bytes of UTF-8
 */
export function encodePltMemo(memo: string): Buffer {
  return encodeCborTag(CBOR_TAG_EMBEDDED_CBOR, encodeCborByteString(encodeMemoToCbor(memo)));
}

/**
 * Encodes the operations blob for a PLT transfer:
 * `array(1) [ map(1) { "transfer": map { fields } } ]`.
 *
 * Exactly one operation. The device rejects a second element with `0x6B10`, and
 * the chain charges per operation, so the wallet never batches.
 *
 * Map keys are emitted in the chain's deterministic order — bytewise on the
 * encoded key, which puts `memo` before `amount` before `recipient`. Neither
 * the device nor the chain requires this on decode; it makes our output
 * reproducible and byte-comparable against the reference encoder.
 *
 * @throws If the amount, decimals or memo is out of range
 */
export function encodePltTransferOperations(transfer: PltTransfer): Buffer {
  const fields: [Buffer, Buffer][] = [
    [encodeCborTextString("amount"), encodePltAmount(transfer.amount, transfer.decimals)],
    [
      encodeCborTextString("recipient"),
      encodePltAddress(transfer.recipient, transfer.includeCoinInfo),
    ],
  ];

  if (transfer.memo !== undefined) {
    fields.push([encodeCborTextString("memo"), encodePltMemo(transfer.memo)]);
  }

  const operations = encodeCborArray([
    encodeCborMapDeterministic([
      [encodeCborTextString("transfer"), encodeCborMapDeterministic(fields)],
    ]),
  ]);

  // Unreachable while `transfer` is the only operation and the memo is capped
  // at MAX_MEMO_LENGTH: the worst case — longest memo, widest amount, coin info
  // included — measures 355 of the 512. Kept as a backstop for future operation
  // types, hence excluded from coverage.
  /* istanbul ignore next */
  if (operations.length > PLT_CBOR_MAX_SIZE) {
    throw new Error(
      `PLT operations blob is ${operations.length} bytes, exceeding the device limit of ${PLT_CBOR_MAX_SIZE}`,
    );
  }

  return operations;
}
