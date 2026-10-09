import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha256";
import { blake2b } from "@noble/hashes/blake2b";
import { bech32m } from "@ledgerhq/wallet-btc/crypto/bech32m";

/**
 * Test-only ZIP-316 Unified Address encoder (forward F4Jumble), ported from
 * librustzcash components/f4jumble. Production code only ever decodes UAs, so
 * the forward direction lives here to build fixtures for any network.
 */

const PAD_LENGTH = 16;

function personalization(tag: string, i: number, j = 0): Uint8Array {
  const p = new Uint8Array(16);
  for (let k = 0; k < tag.length; k++) p[k] = tag.charCodeAt(k);
  p[13] = i;
  p[14] = j & 0xff;
  p[15] = (j >> 8) & 0xff;
  return p;
}

function jumble(bytes: Uint8Array, order: Array<["h" | "g", number]>): Uint8Array {
  const leftLen = Math.min(64, Math.floor(bytes.length / 2));
  const left = bytes.slice(0, leftLen);
  const right = bytes.slice(leftLen);
  for (const [kind, i] of order) {
    if (kind === "h") {
      const h = blake2b(right, {
        dkLen: leftLen,
        personalization: personalization("UA_F4Jumble_H", i),
      });
      for (let k = 0; k < leftLen; k++) left[k] ^= h[k];
    } else {
      for (let j = 0; j < Math.ceil(right.length / 64); j++) {
        const h = blake2b(left, {
          dkLen: 64,
          personalization: personalization("UA_F4Jumble_G", i, j),
        });
        const size = Math.min(64, right.length - j * 64);
        for (let k = 0; k < size; k++) right[j * 64 + k] ^= h[k];
      }
    }
  }
  const out = new Uint8Array(bytes.length);
  out.set(left, 0);
  out.set(right, leftLen);
  return out;
}

export const f4jumble = (bytes: Uint8Array): Uint8Array =>
  jumble(bytes, [
    ["g", 0],
    ["h", 0],
    ["g", 1],
    ["h", 1],
  ]);

export const f4jumbleInverse = (bytes: Uint8Array): Uint8Array =>
  jumble(bytes, [
    ["h", 1],
    ["g", 1],
    ["h", 0],
    ["g", 0],
  ]);

export type Receiver = { typecode: number; data: Uint8Array };

/**
 * Encodes receivers as a Unified Address with the given HRP ("u", "utest").
 * `paddingHrp` overrides the HRP written in the F4Jumble padding, to build
 * addresses with a wrong padding.
 */
export function encodeUnifiedAddress(
  hrp: string,
  receivers: Receiver[],
  paddingHrp: string = hrp,
): string {
  const body: number[] = [];
  for (const { typecode, data } of receivers) body.push(typecode, data.length, ...data);
  const padding = new Array<number>(PAD_LENGTH).fill(0);
  for (let i = 0; i < paddingHrp.length; i++) padding[i] = paddingHrp.charCodeAt(i);
  const jumbled = f4jumble(new Uint8Array([...body, ...padding]));
  return bech32m.encode(hrp, bech32m.toWords(Buffer.from(jumbled)), 512);
}

/** Decodes a Unified Address back to its receivers (the inverse of the above). */
export function decodeUnifiedAddress(hrp: string, address: string): Receiver[] {
  const { prefix, words } = bech32m.decode(address, 512);
  if (prefix !== hrp) throw new Error(`unexpected HRP ${prefix}`);
  const plain = f4jumbleInverse(new Uint8Array(bech32m.fromWords(words)));
  const body = plain.slice(0, plain.length - PAD_LENGTH);
  const receivers: Receiver[] = [];
  for (let offset = 0; offset < body.length;) {
    const typecode = body[offset];
    const length = body[offset + 1];
    receivers.push({ typecode, data: body.slice(offset + 2, offset + 2 + length) });
    offset += 2 + length;
  }
  return receivers;
}

/** Base58Check of a payload (version bytes followed by the 20-byte hash). */
export function base58check(payload: Uint8Array): string {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  return bs58.encode(new Uint8Array([...payload, ...checksum]));
}
