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
  PLT_CBOR_MAX_SIZE,
} from "./cbor";

/**
 * CBOR tag for a decimal fraction, `[exponent, significand]` (RFC 8949 §3.4.4).
 * CIS-7 uses it for token amounts.
 */
const CBOR_TAG_DECIMAL_FRACTION = 4;

/**
 * CBOR tag marking a byte string as embedded CBOR (RFC 8949 §3.4.5.1).
 * CIS-7 allows a memo to be tagged with it, or left as a bare byte string.
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
 * Largest PLT memo, in bytes.
 *
 * The chain caps this independently of the CBOR budget, so the 512-byte budget
 * is not a sufficient check: a 400-byte memo fits it and still fails on chain.
 */
const MAX_MEMO_SIZE = 256;

/**
 * Largest number of decimals a PLT amount may carry.
 *
 * The chain accepts up to 255, but the device is tighter: it holds the exponent
 * in a signed byte and rejects a raw negative-integer argument above 127, which
 * caps the exponent at -128. Take the tighter bound, so a payload we accept
 * locally is one both sides accept.
 */
const MAX_DECIMALS = 128;

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
   * Optional memo, as raw bytes, at most 256. Distinct from the CCD memo, which
   * is a CBOR text string — do not use `encodeMemoToCbor` here.
   */
  memo?: Buffer;
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
 * @throws If `amount` is negative or exceeds 64 bits, or `decimals` is outside 0..128
 */
export function encodePltAmount(amount: bigint, decimals: number): Buffer {
  if (amount < 0n) {
    throw new Error(`PLT amount must not be negative, got ${amount}`);
  }
  if (amount > MAX_SIGNIFICAND) {
    throw new Error(`PLT amount ${amount} exceeds the unsigned 64-bit range`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new Error(`PLT decimals must be an integer in 0..${MAX_DECIMALS}, got ${decimals}`);
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
 * Encodes a CIS-7 memo, as a bare byte string or wrapped in tag 24.
 *
 * The chain's `TaggableMemo` accepts either and strips the tag; the device
 * accepts either too. The untagged form is the default because it is two bytes
 * shorter and is what the device's own fixtures use.
 *
 * @throws If the memo exceeds the chain's 256-byte limit
 */
export function encodePltMemo(memo: Buffer, tagged = false): Buffer {
  if (memo.length > MAX_MEMO_SIZE) {
    throw new Error(
      `PLT memo is ${memo.length} bytes, exceeding the chain limit of ${MAX_MEMO_SIZE}`,
    );
  }

  const encoded = encodeCborByteString(memo);
  return tagged ? encodeCborTag(CBOR_TAG_EMBEDDED_CBOR, encoded) : encoded;
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

  // Unreachable while `transfer` is the only operation and the memo is capped at
  // 256: the worst case lands near 350 bytes. Kept as a backstop for future
  // operation types, which is why it is excluded from coverage.
  /* istanbul ignore next */
  if (operations.length > PLT_CBOR_MAX_SIZE) {
    throw new Error(
      `PLT operations blob is ${operations.length} bytes, exceeding the device limit of ${PLT_CBOR_MAX_SIZE}`,
    );
  }

  return operations;
}
