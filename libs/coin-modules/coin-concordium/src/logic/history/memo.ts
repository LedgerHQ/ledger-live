import { decodeMemoFromCbor } from "@ledgerhq/concordium-core";
import { log } from "@ledgerhq/logs";

const HEX_PAIRS = /^(?:[0-9a-fA-F]{2})+$/;

/**
 * Decodes a hex string, rejecting anything Node would silently truncate.
 *
 * `Buffer.from(hex, "hex")` stops at the first character outside the alphabet
 * and drops a trailing nibble, so `"6162zz63"` yields the two bytes of `"ab"`
 * rather than an error. The proxy's response is not schema-checked, so without
 * this a malformed memo reaches the user as a shortened one.
 */
function decodeHex(hex: string, txHash: string, kind: string): Buffer | undefined {
  if (!HEX_PAIRS.test(hex)) {
    log("concordium", `Failed to decode ${kind} for tx ${txHash}`, { reason: "not hex" });
    return undefined;
  }

  return Buffer.from(hex, "hex");
}

/**
 * Rejects a decoded memo carrying anything from Unicode's `Other` category.
 *
 * A memo is sender-controlled and renders beside an amount. `U+202E` reverses
 * the text around it, a zero-width character hides in it, and a control code
 * has no rendering at all; `\p{C}` covers all three.
 *
 * Applies to whatever either decoder returns, not only to the raw-text
 * fallback: a CBOR text string can hold these just as bare bytes can.
 */
function printableOrUndefined(text: string, txHash: string, kind: string): string | undefined {
  if (/\p{C}/u.test(text)) {
    log("concordium", `Failed to decode ${kind} for tx ${txHash}`, {
      reason: "control or format character in the text",
    });
    return undefined;
  }

  return text;
}

/**
 * Decodes a hex-encoded CBOR memo. Returns undefined (and logs) when the bytes
 * do not decode, or when the text they hold is not safe to render.
 */
export function decodeMemo(hex: string, txHash: string): string | undefined {
  const bytes = decodeHex(hex, txHash, "memo");
  if (!bytes) return undefined;

  try {
    return printableOrUndefined(decodeMemoFromCbor(bytes), txHash, "memo");
  } catch (error) {
    log("concordium", `Failed to decode memo for tx ${txHash}`, { error });
    return undefined;
  }
}

/**
 * Decodes a PLT memo, falling back to raw text for senders that wrote one.
 *
 * The wallet writes the same CBOR text string a CCD memo carries. The fallback
 * exists because the discriminator does not survive the round trip: on chain the
 * memo is a `CborMemo`, where tag 24 says the content is CBOR and its absence
 * says it is raw, but the node strips that wrapper when it emits the transfer
 * event (`TokenTransferEvent.memo` is a plain `Memo`). A reader cannot tell
 * which variant was signed.
 *
 * Integers are excluded, unlike the CCD path, because the fallback is what makes
 * them unaffordable: their head bytes are the ASCII digits it exists to catch.
 * Excluding them does not suppress them — a negative integer's head byte is
 * printable, so `31` reaches the fallback and reads as `"1"` rather than `-18`.
 * Nothing in the payload separates the two, so one must be misread, and digits
 * are what senders write as references.
 *
 * Trying CBOR first is safe only because the decoder requires the value to fill
 * the buffer. What survives that is irreducible: raw text whose first character
 * encodes exactly the count that follows (`"ab"`, `"bye"`, `"cash"`) reads as
 * CBOR, which is what this wallet writes.
 *
 * Raw bytes are accepted only as valid UTF-8: CIS-7 places no encoding on them,
 * so a binary memo is legal, and rendering one would put replacement characters
 * on screen. Either branch's text then goes through
 * {@link printableOrUndefined}.
 */
export function decodePltMemo(hex: string, txHash: string): string | undefined {
  const bytes = decodeHex(hex, txHash, "PLT memo");
  if (!bytes) return undefined;

  let cborError: unknown;
  try {
    const decoded = decodeMemoFromCbor(bytes, { allowIntegers: false });
    return printableOrUndefined(decoded, txHash, "PLT memo");
  } catch (error) {
    // Kept for the log below: the fallback decides, but if it also fails this
    // says whether the sender wrote raw bytes or malformed CBOR.
    cborError = error;
  }

  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes)) {
    log("concordium", `Failed to decode PLT memo for tx ${txHash}`, {
      reason: "neither CBOR nor valid UTF-8",
      cborError,
    });
    return undefined;
  }

  return printableOrUndefined(text, txHash, "PLT memo");
}
