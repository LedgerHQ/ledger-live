import { blake2b } from "@noble/hashes/blake2b";
import { bech32m } from "../../bech32m";
import type { ZcashTransferType } from "./types";

// ZIP-316 receiver typecodes
const TYPECODE_P2PKH = 0x00;
const TYPECODE_P2SH = 0x01;
const TYPECODE_SAPLING = 0x02;
const TYPECODE_ORCHARD = 0x03;

// Mainnet HRPs
const UA_HRP_MAINNET = "u";
const SAPLING_HRP_MAINNET = "zs";

// ZIP-316 section 5.3: trailing padding is HRP zero-padded to 16 bytes
const F4JUMBLE_HRP_PAD_LENGTH = 16;

/**
 * The result of classifying a Zcash recipient address.
 *
 * - { recipientType: "public" }  -- transparent t1/t3 or UA with only transparent receiver(s).
 * - { recipientType: "private" } -- UA containing an Orchard receiver (typecode 0x03).
 * - { error: "sapling-unsupported" } -- Sapling zs or UA without an Orchard receiver.
 * - { error: "invalid" } -- not a parseable Zcash address (includes Sprout zc).
 */
export type ZcashRecipientClass =
  | { recipientType: "public" }
  | { recipientType: "private" }
  | { error: "sapling-unsupported" }
  | { error: "invalid" };

/**
 * Inverse F4Jumble permutation from ZIP-316 section 3.
 *
 * F4Jumble is a wide-block permutation using BLAKE2b with personalization "UA-F4Jumble".
 * Split: H = min(l, 64); left = bytes[0..H], right = bytes[H..l].
 *
 * Forward: a = left XOR H(right), b = right XOR H(a), c = a XOR H(b), d = b XOR H(c)
 * Inverse (given output c || d):
 *   b = d XOR BLAKE2b(c, outlen=l-H)
 *   a = c XOR BLAKE2b(b, outlen=H)
 */
function f4jumbleInverse(bytes: Uint8Array): Uint8Array {
  const l = bytes.length;
  const H = Math.min(l, 64);

  const personStr = "UA-F4Jumble";
  const person = new Uint8Array(16);
  for (let i = 0; i < personStr.length; i++) {
    person[i] = personStr.charCodeAt(i);
  }

  const c = bytes.slice(0, H);
  const d = bytes.slice(H);

  // b = d XOR BLAKE2b(c, outlen=l-H)
  const hashC = blake2b(c, { dkLen: l - H, personalization: person });
  const b = new Uint8Array(l - H);
  for (let i = 0; i < l - H; i++) {
    b[i] = d[i] ^ hashC[i];
  }

  // a = c XOR BLAKE2b(b, outlen=H)
  const hashB = blake2b(b, { dkLen: H, personalization: person });
  const a = new Uint8Array(H);
  for (let i = 0; i < H; i++) {
    a[i] = c[i] ^ hashB[i];
  }

  const result = new Uint8Array(l);
  result.set(a, 0);
  result.set(b, H);
  return result;
}

/**
 * Decode a ZIP-316 Unified Address into its list of receiver typecodes.
 *
 * Returns null when the address is not a valid mainnet UA.
 *
 * Steps (ZIP-316 section 5.3):
 * 1. bech32m-decode with HRP "u" and LIMIT=512 (UAs exceed the default 90-char limit).
 * 2. Convert 5-bit words to bytes.
 * 3. Invert F4Jumble.
 * 4. Strip and verify the 16-byte HRP padding suffix ("u" + 15 zero bytes).
 * 5. Walk compact-size (typecode, length, data) tuples.
 */
export function decodeUnifiedAddressTypecodes(address: string): number[] | null {
  let decoded: { prefix: string; words: number[] };
  try {
    decoded = bech32m.decode(address.toLowerCase(), 512);
  } catch {
    return null;
  }

  if (decoded.prefix !== UA_HRP_MAINNET) {
    return null;
  }

  let bytes: number[];
  try {
    bytes = bech32m.fromWords(decoded.words);
  } catch {
    return null;
  }

  if (bytes.length < F4JUMBLE_HRP_PAD_LENGTH + 2) {
    return null;
  }

  const plaintext = f4jumbleInverse(new Uint8Array(bytes));

  // Verify trailing 16-byte padding: "u" + 15 zero bytes
  const suffix = plaintext.slice(plaintext.length - F4JUMBLE_HRP_PAD_LENGTH);
  if (suffix[0] !== UA_HRP_MAINNET.charCodeAt(0)) {
    return null;
  }
  for (let i = 1; i < F4JUMBLE_HRP_PAD_LENGTH; i++) {
    if (suffix[i] !== 0) {
      return null;
    }
  }

  // Receiver data is everything before the 16-byte suffix
  const receiverBytes = plaintext.slice(0, plaintext.length - F4JUMBLE_HRP_PAD_LENGTH);

  // Walk compact-size-encoded (typecode, length, data) tuples
  const typecodes: number[] = [];
  let offset = 0;
  while (offset < receiverBytes.length) {
    if (offset + 2 > receiverBytes.length) {
      return null;
    }
    const typecode = receiverBytes[offset++];
    const length = receiverBytes[offset++];
    if (offset + length > receiverBytes.length) {
      return null;
    }
    typecodes.push(typecode);
    offset += length;
  }

  return typecodes.length > 0 ? typecodes : null;
}

/**
 * Classify a recipient address string for the Zcash shielded send flow.
 */
export function classifyZcashRecipient(address: string): ZcashRecipientClass {
  const lower = address.toLowerCase();

  // Transparent: t1 (P2PKH) or t3 (P2SH) on Zcash mainnet
  if (lower.startsWith("t1") || lower.startsWith("t3")) {
    // Zcash t-addresses are Base58Check, 35 chars
    if (address.length >= 34 && address.length <= 36) {
      return { recipientType: "public" };
    }
    return { error: "invalid" };
  }

  // Sapling: zs1 (Bech32, HRP "zs")
  if (lower.startsWith(SAPLING_HRP_MAINNET + "1")) {
    return { error: "sapling-unsupported" };
  }

  // Sprout: zc (legacy, unconditionally invalid in this flow)
  if (lower.startsWith("zc")) {
    return { error: "invalid" };
  }

  // Unified Address: bech32m with HRP "u"
  if (lower.startsWith(UA_HRP_MAINNET + "1")) {
    const typecodes = decodeUnifiedAddressTypecodes(address);
    if (typecodes === null) {
      return { error: "invalid" };
    }

    if (typecodes.includes(TYPECODE_ORCHARD)) {
      return { recipientType: "private" };
    }

    // UA without Orchard: Sapling-only, transparent-only, or Sapling+transparent
    if (
      typecodes.includes(TYPECODE_SAPLING) ||
      typecodes.includes(TYPECODE_P2PKH) ||
      typecodes.includes(TYPECODE_P2SH)
    ) {
      return { error: "sapling-unsupported" };
    }

    // UA with only unknown typecodes
    return { error: "invalid" };
  }

  return { error: "invalid" };
}

/**
 * Derive transferType from the (sender, recipientType) pair.
 *
 * | sender  | recipientType | transferType            |
 * |---------|---------------|-------------------------|
 * | public  | public        | transparent             |
 * | public  | private       | transparent-to-shielded |
 * | private | public        | shielded-to-transparent |
 * | private | private       | shielded                |
 * | public  | undefined     | transparent             |
 * | private | undefined     | shielded (safe default) |
 * | undef   | any           | transparent             |
 */
export function deriveZcashTransferType(
  sender: "public" | "private" | undefined,
  recipientType: "public" | "private" | undefined,
): ZcashTransferType {
  if (sender === "private") {
    if (recipientType === "public") return "shielded-to-transparent";
    return "shielded";
  }
  if (recipientType === "private") return "transparent-to-shielded";
  return "transparent";
}

export { TYPECODE_P2PKH, TYPECODE_P2SH, TYPECODE_SAPLING, TYPECODE_ORCHARD };
