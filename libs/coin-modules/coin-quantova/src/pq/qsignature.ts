/**
 * On-chain `QSignature` envelope codec.
 *
 * The runtime's `QSignature` is a SCALE enum (`primitives/account`):
 *
 *   QSignature = variant_byte(0|1|2)
 *              || compact(len(signature)) || signature_bytes   // BoundedVec<u8>
 *              || public_key_bytes                              // fixed [u8; N]
 *
 * variant: 0 = SPHINCS+, 1 = Falcon, 2 = Dilithium. This is the exact byte layout a
 * device app must emit; modelling it here keeps the host and an eventual on-device app
 * byte-compatible.
 */
import { QScheme, QSCHEMES, schemeFromVariant } from "./schemes";

export type QSignatureEnvelope = {
  scheme: QScheme;
  /** raw signature bytes */
  signature: Uint8Array;
  /** raw public-key bytes (length must match the scheme) */
  publicKey: Uint8Array;
};

/** SCALE compact-uint encoding (used here for the signature length prefix). */
export function compactEncode(n: number): Uint8Array {
  if (n < 0 || !Number.isInteger(n)) throw new Error("compact: non-negative integer required");
  if (n < 1 << 6) return Uint8Array.of(n << 2); // single-byte mode
  if (n < 1 << 14) {
    const v = ((n << 2) | 0b01) >>> 0;
    return Uint8Array.of(v & 0xff, (v >>> 8) & 0xff); // two-byte mode
  }
  if (n < 1 << 30) {
    const v = ((n << 2) | 0b10) >>> 0; // unsigned: n<<2 can set bit 31
    return Uint8Array.of(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  }
  // big-integer mode (4..67 bytes); sufficient for any PQ signature length.
  const bytes: number[] = [];
  let x = n;
  while (x > 0) {
    bytes.push(x & 0xff);
    x = Math.floor(x / 256);
  }
  return Uint8Array.of(((bytes.length - 4) << 2) | 0b11, ...bytes);
}

/** Decode a SCALE compact-uint, returning [value, bytesConsumed]. */
export function compactDecode(buf: Uint8Array, offset = 0): [number, number] {
  const first = buf[offset];
  const mode = first & 0b11;
  if (mode === 0b00) return [first >>> 2, 1];
  if (mode === 0b01) return [((first | (buf[offset + 1] << 8)) >>> 0) >>> 2, 2];
  if (mode === 0b10) {
    const v = (first | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24)) >>> 0;
    return [v >>> 2, 4]; // unsigned: 4-byte compact values can exceed 2^31
  }
  const len = (first >> 2) + 4;
  let v = 0;
  for (let i = 0; i < len; i++) v += buf[offset + 1 + i] * 256 ** i;
  return [v, 1 + len];
}

/** Encode a `QSignature` to its exact on-chain byte layout. */
export function encodeQSignature(env: QSignatureEnvelope): Uint8Array {
  const params = QSCHEMES[env.scheme];
  if (env.publicKey.length !== params.publicKeyLength) {
    throw new Error(
      `${params.label}: public key must be ${params.publicKeyLength} bytes, got ${env.publicKey.length}`,
    );
  }
  if (env.signature.length > params.maxSignatureLength) {
    throw new Error(
      `${params.label}: signature exceeds ${params.maxSignatureLength} bytes (${env.signature.length})`,
    );
  }
  const len = compactEncode(env.signature.length);
  const out = new Uint8Array(1 + len.length + env.signature.length + env.publicKey.length);
  let o = 0;
  out[o++] = params.variant;
  out.set(len, o); o += len.length;
  out.set(env.signature, o); o += env.signature.length;
  out.set(env.publicKey, o);
  return out;
}

/** Decode an on-chain `QSignature` envelope. */
export function decodeQSignature(buf: Uint8Array): QSignatureEnvelope {
  const scheme = schemeFromVariant(buf[0]);
  const params = QSCHEMES[scheme];
  const [sigLen, lenBytes] = compactDecode(buf, 1);
  const sigStart = 1 + lenBytes;
  const signature = buf.slice(sigStart, sigStart + sigLen);
  const publicKey = buf.slice(sigStart + sigLen, sigStart + sigLen + params.publicKeyLength);
  return { scheme, signature, publicKey };
}
