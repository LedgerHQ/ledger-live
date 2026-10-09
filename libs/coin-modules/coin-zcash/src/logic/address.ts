import { blake2b } from "@noble/hashes/blake2b";
import { bech32m } from "@ledgerhq/wallet-btc/crypto/bech32m";
import type { ZcashTransferType } from "../types/bridge";
import type { ZcashNetwork } from "./network";

// ZIP-316 receiver typecodes
const TYPECODE_P2PKH = 0x00;
const TYPECODE_P2SH = 0x01;
const TYPECODE_SAPLING = 0x02;
const TYPECODE_ORCHARD = 0x03;

// ZIP-316 fixed receiver data lengths (bytes) for the known receiver types.
// Unknown typecodes have no fixed length and are accepted with the length they declare.
const RECEIVER_LENGTHS = new Map<number, number>([
  [TYPECODE_P2PKH, 20],
  [TYPECODE_P2SH, 20],
  [TYPECODE_SAPLING, 43],
  [TYPECODE_ORCHARD, 43],
]);

// Per-network human-readable parts and transparent address prefixes
const NETWORK_ENCODINGS: Record<
  ZcashNetwork,
  { uaHrp: string; saplingHrp: string; transparent: string[] }
> = {
  mainnet: { uaHrp: "u", saplingHrp: "zs", transparent: ["t1", "t3"] },
  testnet: { uaHrp: "utest", saplingHrp: "ztestsapling", transparent: ["tm", "t2"] },
};
const NETWORKS = Object.keys(NETWORK_ENCODINGS) as ZcashNetwork[];

// ZIP-316 section 5.3: trailing padding is HRP zero-padded to 16 bytes
const F4JUMBLE_HRP_PAD_LENGTH = 16;

/**
 * The result of classifying a Zcash recipient address.
 *
 * - { recipientType: "public" }  -- transparent t1/t3 (tm/t2 on testnet) or UA with only transparent receiver(s).
 * - { recipientType: "private" } -- UA containing an Orchard receiver (typecode 0x03).
 * - { error: "sapling-unsupported" } -- Sapling zs (ztestsapling on testnet) or UA with a Sapling but no Orchard receiver.
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
 * Read a Bitcoin-style CompactSize integer (ZIP-316 encodes UA receiver
 * typecodes and lengths as CompactSize).
 *
 * Encoding:
 * - first byte < 0xfd            -> value is that byte
 * - first byte == 0xfd           -> value is the next 2 bytes, little-endian
 * - first byte == 0xfe           -> value is the next 4 bytes, little-endian
 * - first byte == 0xff           -> value is the next 8 bytes, little-endian
 *
 * Returns the decoded value and the offset past it, or null when the buffer is
 * truncated or the encoding is non-canonical (a value that should have used a
 * shorter form).
 */
function readCompactSize(
  bytes: Uint8Array,
  offset: number,
): { value: number; offset: number } | null {
  if (offset >= bytes.length) {
    return null;
  }
  const first = bytes[offset++];

  if (first < 0xfd) {
    return { value: first, offset };
  }

  let byteCount: number;
  let minimum: number;
  if (first === 0xfd) {
    byteCount = 2;
    minimum = 0xfd;
  } else if (first === 0xfe) {
    byteCount = 4;
    minimum = 0x10000;
  } else {
    byteCount = 8;
    minimum = 0x100000000;
  }

  if (offset + byteCount > bytes.length) {
    return null;
  }

  let value = 0;
  for (let i = 0; i < byteCount; i++) {
    value += bytes[offset + i] * 2 ** (8 * i);
  }
  offset += byteCount;

  if (value < minimum) {
    return null;
  }

  return { value, offset };
}

/**
 * bech32m-decode a UA of the given HRP and convert its 5-bit words to bytes.
 *
 * Returns null when the string is not a valid bech32m UA with that HRP or is
 * too short to hold the F4Jumble padding plus a minimal receiver.
 */
function decodeUnifiedAddressBytes(address: string, hrp: string): Uint8Array | null {
  let decoded: { prefix: string; words: number[] };
  try {
    // LIMIT=512 because UAs exceed the default 90-char bech32m limit.
    // Do NOT lower-case here: UAs are case-sensitive (ZIP-316). bech32m accepts
    // an all-lower or all-upper string but rejects mixed case; lower-casing
    // first would defeat that check and wrongly accept a mixed-case address.
    decoded = bech32m.decode(address, 512);
  } catch {
    return null;
  }

  if (decoded.prefix !== hrp) {
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

  return new Uint8Array(bytes);
}

/**
 * Strip and verify the trailing 16-byte HRP padding (the HRP followed by zero
 * bytes up to 16) from an F4Jumble-inverted UA plaintext, returning the leading
 * receiver bytes.
 *
 * Returns null when the padding suffix is malformed.
 */
function stripHrpPadding(plaintext: Uint8Array, hrp: string): Uint8Array | null {
  const suffixStart = plaintext.length - F4JUMBLE_HRP_PAD_LENGTH;
  const suffix = plaintext.slice(suffixStart);

  const paddingValid = suffix.every((byte, i) => byte === (i < hrp.length ? hrp.charCodeAt(i) : 0));
  if (!paddingValid) {
    return null;
  }

  return plaintext.slice(0, suffixStart);
}

/**
 * Walk the CompactSize-encoded (typecode, length, data) tuples of a UA's
 * receiver bytes (ZIP-316 section 5.3) and collect the receiver typecodes.
 *
 * Returns null when the encoding is truncated, non-canonical, or a known
 * receiver type declares an unexpected data length.
 */
function readReceiverTypecodes(receiverBytes: Uint8Array): number[] | null {
  const typecodes: number[] = [];
  let offset = 0;
  while (offset < receiverBytes.length) {
    const typecodeRead = readCompactSize(receiverBytes, offset);
    const lengthRead = typecodeRead && readCompactSize(receiverBytes, typecodeRead.offset);
    if (typecodeRead === null || !lengthRead) {
      return null;
    }

    const typecode = typecodeRead.value;
    const length = lengthRead.value;
    offset = lengthRead.offset;

    // A known receiver type must declare its fixed data length; reject the UA
    // otherwise so a malformed receiver cannot be misclassified (e.g. an Orchard
    // typecode with a bogus length being treated as a private recipient).
    const expectedLength = RECEIVER_LENGTHS.get(typecode);
    const lengthValid = expectedLength === undefined || length === expectedLength;
    if (!lengthValid || offset + length > receiverBytes.length) {
      return null;
    }

    typecodes.push(typecode);
    offset += length;
  }

  return typecodes;
}

/**
 * Decode a ZIP-316 Unified Address into its list of receiver typecodes.
 *
 * Returns null when the address is not a valid UA of the given network
 * (mainnet by default).
 *
 * Steps (ZIP-316 section 5.3):
 * 1. bech32m-decode with the network's HRP ("u" or "utest") and LIMIT=512 (UAs exceed the default 90-char limit).
 * 2. Convert 5-bit words to bytes.
 * 3. Invert F4Jumble.
 * 4. Strip and verify the 16-byte HRP padding suffix (the HRP + zero bytes).
 * 5. Walk compact-size (typecode, length, data) tuples.
 */
export function decodeUnifiedAddressTypecodes(
  address: string,
  network: ZcashNetwork = "mainnet",
): number[] | null {
  const hrp = NETWORK_ENCODINGS[network].uaHrp;
  const bytes = decodeUnifiedAddressBytes(address, hrp);
  if (bytes === null) {
    return null;
  }

  const plaintext = f4jumbleInverse(bytes);

  const receiverBytes = stripHrpPadding(plaintext, hrp);
  if (receiverBytes === null) {
    return null;
  }

  const typecodes = readReceiverTypecodes(receiverBytes);
  if (typecodes === null || typecodes.length === 0) {
    return null;
  }

  return typecodes;
}

/**
 * Whether an address is shielded -- a unified address or a Sapling one, as
 * opposed to a transparent t-address.
 *
 * Reads the human-readable prefix rather than decoding the address, because
 * this answers "may this string be shown in the clear", where an address that
 * merely looks shielded must be hidden all the same. A unified address holding
 * nothing but transparent receivers is therefore reported shielded, which
 * `classifyZcashRecipient` -- the answer to the other question, what a send to
 * it would be -- calls public.
 */
export function isZcashShieldedAddress(address: string): boolean {
  const lower = address.toLowerCase();
  return NETWORKS.some(network => {
    const { uaHrp, saplingHrp } = NETWORK_ENCODINGS[network];
    return lower.startsWith(uaHrp + "1") || lower.startsWith(saplingHrp + "1");
  });
}

/**
 * Classify a recipient address string for the Zcash shielded send flow, on the
 * given network (mainnet by default). An address of the other network is invalid.
 */
export function classifyZcashRecipient(
  address: string,
  network: ZcashNetwork = "mainnet",
): ZcashRecipientClass {
  const lower = address.toLowerCase();
  const { uaHrp, saplingHrp, transparent } = NETWORK_ENCODINGS[network];

  // Transparent: P2PKH or P2SH (t1/t3 on mainnet, tm/t2 on testnet)
  if (transparent.some(prefix => lower.startsWith(prefix))) {
    // Zcash t-addresses are Base58Check of a fixed 26-byte payload (2-byte
    // version prefix + 20-byte hash + 4-byte checksum). The version prefix is
    // fixed and non-zero (0x1CB8 for t1, 0x1CBD for t3 on mainnet; 0x1D25 for tm,
    // 0x1CBA for t2 on testnet), so the encoding is always exactly 35 characters.
    if (address.length === 35) {
      return { recipientType: "public" };
    }
    return { error: "invalid" };
  }

  // Sapling: Bech32 with HRP "zs" (mainnet) or "ztestsapling" (testnet)
  if (lower.startsWith(saplingHrp + "1")) {
    return { error: "sapling-unsupported" };
  }

  // Sprout: zc (legacy, unconditionally invalid in this flow)
  if (lower.startsWith("zc")) {
    return { error: "invalid" };
  }

  // Unified Address: bech32m with HRP "u" (mainnet) or "utest" (testnet)
  if (lower.startsWith(uaHrp + "1")) {
    const typecodes = decodeUnifiedAddressTypecodes(address, network);
    if (typecodes === null) {
      return { error: "invalid" };
    }

    if (typecodes.includes(TYPECODE_ORCHARD)) {
      return { recipientType: "private" };
    }

    // UA without Orchard but with a Sapling receiver (Sapling-only or
    // Sapling+transparent): Sapling is unsupported and there is no Orchard fallback.
    if (typecodes.includes(TYPECODE_SAPLING)) {
      return { error: "sapling-unsupported" };
    }

    // UA with only transparent receiver(s) (P2PKH/P2SH, no shielded receiver):
    // treat as a public recipient.
    if (typecodes.includes(TYPECODE_P2PKH) || typecodes.includes(TYPECODE_P2SH)) {
      return { recipientType: "public" };
    }

    // UA with only unknown typecodes
    return { error: "invalid" };
  }

  return { error: "invalid" };
}

/**
 * Classify a recipient for callers that have no account, and so no network:
 * the first network that accepts the address gives its shape (public/private).
 * This only derives the shape; whether the address is valid for the account's
 * network is decided where the account is known (`getTransactionStatus`).
 */
export function classifyZcashRecipientShape(address: string): ZcashRecipientClass {
  let result: ZcashRecipientClass = { error: "invalid" };
  for (const network of NETWORKS) {
    const cls = classifyZcashRecipient(address, network);
    if (!("error" in cls)) return cls;
    if (cls.error === "sapling-unsupported") result = cls;
  }
  return result;
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
 * | undef   | private       | transparent-to-shielded |
 * | undef   | public/undef  | transparent             |
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

// readCompactSize is exported for unit testing of the ZIP-316 CompactSize parser.
export { TYPECODE_P2PKH, TYPECODE_P2SH, TYPECODE_SAPLING, TYPECODE_ORCHARD, readCompactSize };
