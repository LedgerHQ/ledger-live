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
function decodeHex(hex: string, txHash: string): Buffer | undefined {
  if (!HEX_PAIRS.test(hex)) {
    log("concordium", `Failed to decode memo for tx ${txHash}`, { reason: "not hex" });
    return undefined;
  }

  return Buffer.from(hex, "hex");
}

/**
 * Decodes a hex-encoded CBOR memo. Returns undefined (and logs) when decoding fails.
 */
export function decodeMemo(hex: string, txHash: string): string | undefined {
  const bytes = decodeHex(hex, txHash);
  if (!bytes) return undefined;

  try {
    return decodeMemoFromCbor(bytes);
  } catch (error) {
    log("concordium", `Failed to decode memo for tx ${txHash}`, { error });
    return undefined;
  }
}

/**
 * Decodes a PLT memo, which the proxy reports as raw bytes rather than CBOR.
 *
 * A native memo arrives CBOR-encoded and keeps its header — `"send with memo"`
 * reaches us as `6e73656e64…`. The same memo on a PLT transfer arrives as
 * `73656e64…`: the chain holds it inside a CBOR byte string, and the proxy
 * unwraps that before serialising the transfer summary.
 *
 * Passing those bytes to {@link decodeMemo} does not merely fail. `0x73` sits in
 * the CBOR text-string range, so the header is read as "19 characters follow"
 * and a 14-byte memo is rejected for being short. A memo whose first byte
 * happens to agree with its length would decode to a silently truncated string
 * instead, which is why this path never attempts CBOR.
 *
 * The bytes are arbitrary — CIS-7 places no encoding on them — so a memo that is
 * not valid UTF-8 yields undefined rather than replacement characters. The
 * round-trip is the test: `Buffer.toString("utf8")` substitutes U+FFFD for
 * invalid sequences, and re-encoding that string no longer matches the input.
 */
export function decodePltMemo(hex: string, txHash: string): string | undefined {
  const bytes = decodeHex(hex, txHash);
  if (!bytes) return undefined;

  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes)) {
    log("concordium", `Failed to decode PLT memo for tx ${txHash}`, { reason: "not valid UTF-8" });
    return undefined;
  }

  return text;
}
