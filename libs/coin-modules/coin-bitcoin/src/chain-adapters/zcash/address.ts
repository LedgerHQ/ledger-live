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

// ---------------------------------------------------------------------------
// F4Jumble -- ZIP-316 section 3, ported from librustzcash components/f4jumble
// ---------------------------------------------------------------------------

// Personalization for H rounds: b"UA_F4Jumble_H" (13 bytes) + [i, 0, 0]
function hPers(i: number): Uint8Array {
  const p = new Uint8Array(16);
  const s = "UA_F4Jumble_H";
  for (let k = 0; k < s.length; k++) p[k] = s.charCodeAt(k);
  p[13] = i;
  // p[14] and p[15] remain 0
  return p;
}

// Personalization for G rounds: b"UA_F4Jumble_G" (13 bytes) + [i, j & 0xFF, (j >> 8) & 0xFF]
function gPers(i: number, j: number): Uint8Array {
  const p = new Uint8Array(16);
  const s = "UA_F4Jumble_G";
  for (let k = 0; k < s.length; k++) p[k] = s.charCodeAt(k);
  p[13] = i;
  p[14] = j & 0xff;
  p[15] = (j >> 8) & 0xff;
  return p;
}

/**
 * Inverse F4Jumble permutation (ZIP-316 section 3).
 * Ported from librustzcash components/f4jumble.
 *
 * Split: left_length = min(64, floor(len/2))
 *        left  = bytes[0..left_length]
 *        right = bytes[left_length..]
 *
 * h_round(i): h = BLAKE2b(right, dkLen=left.length, pers=H_PERS(i))
 *             left ^= h
 *
 * g_round(i): for j in 0..ceil(right.length/64):
 *               h = BLAKE2b(left, dkLen=64, pers=G_PERS(i,j))
 *               right[j*64..] ^= h (up to right.length)
 *
 * INVERSE applies rounds in order: h_round(1); g_round(1); h_round(0); g_round(0)
 */
function f4jumbleInverse(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const leftLen = Math.min(64, Math.floor(len / 2));

  const left = bytes.slice(0, leftLen);
  const right = bytes.slice(leftLen);

  function hRound(i: number): void {
    const h = blake2b(right, { dkLen: leftLen, personalization: hPers(i) });
    for (let k = 0; k < leftLen; k++) left[k] ^= h[k];
  }

  function gRound(i: number): void {
    const rightLen = right.length;
    const chunks = Math.ceil(rightLen / 64);
    for (let j = 0; j < chunks; j++) {
      const h = blake2b(left, { dkLen: 64, personalization: gPers(i, j) });
      const chunkSize = Math.min(64, rightLen - j * 64);
      for (let k = 0; k < chunkSize; k++) right[j * 64 + k] ^= h[k];
    }
  }

  // Inverse round order: h1, g1, h0, g0
  hRound(1);
  gRound(1);
  hRound(0);
  gRound(0);

  const result = new Uint8Array(len);
  result.set(left, 0);
  result.set(right, leftLen);
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
