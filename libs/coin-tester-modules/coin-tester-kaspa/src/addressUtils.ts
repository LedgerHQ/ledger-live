// Kaspa bech32 address utilities for the local test stack.
// These are copied/adapted from coin-kaspa's kaspaAddresses.ts because the helpers are not
// exported. The only external use is toSimnetAddress(), which converts a kaspa: address to its
// kaspasim: equivalent (same pubkey, simnet network prefix + recomputed checksum). This is
// needed so kaspad --simnet accepts our mining address; kaspad validates the prefix.

import { addressToPublicKey } from "@ledgerhq/coin-kaspa/logic/kaspaAddresses";

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function encode5bit(data: number[]): string {
  return data.map(v => CHARSET[v]).join("");
}

function convertBits(data: number[], from: number, to: number): number[] {
  const result: number[] = [];
  let accumulator = 0;
  let bits = 0;
  const mask = (1 << to) - 1;
  for (const value of data) {
    accumulator = (accumulator << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result.push((accumulator >> bits) & mask);
    }
  }
  if (bits > 0) result.push((accumulator << (to - bits)) & mask);
  return result;
}

function prefixToArray(prefix: string): number[] {
  return Array.from(prefix).map(c => c.charCodeAt(0) & 31);
}

function polymod(data: number[]): number {
  const G1 = [0x98, 0x79, 0xf3, 0xae, 0x1e];
  const G2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];
  let c0 = 0;
  let c1 = 1;
  for (const d of data) {
    const C = c0 >>> 3;
    c0 = ((c0 & 0x07) << 5) | (c1 >>> 27);
    c1 = ((c1 & 0x07ffffff) << 5) ^ d;
    for (let i = 0; i < 5; i++) {
      if (C & (1 << i)) {
        c0 ^= G1[i];
        c1 ^= G2[i];
      }
    }
  }
  c1 ^= 1;
  if (c1 < 0) {
    c1 ^= 1 << 31;
    c1 += (1 << 30) * 2;
  }
  return c0 * (1 << 30) * 4 + c1;
}

function checksumToArray(checksum: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < 8; i++) {
    result.push(checksum & 31);
    checksum = Math.floor(checksum / 32);
  }
  return result.reverse();
}

function encodeKaspaAddress(prefix: string, version: number, publicKey: number[]): string {
  const eight0 = [0, 0, 0, 0, 0, 0, 0, 0];
  const prefixData = prefixToArray(prefix).concat([0]);
  const payloadData = convertBits([version, ...publicKey], 8, 5);
  const checksumData = [...prefixData, ...payloadData, ...eight0];
  const checksum = checksumToArray(polymod(checksumData));
  return `${prefix}:${encode5bit([...payloadData, ...checksum])}`;
}

/**
 * Re-encode a kaspa: address with the kaspasim: prefix (simnet).
 * Same underlying pubkey/script, different network prefix + checksum.
 * kaspad --simnet validates the address prefix for --mining-address, so the mining
 * address must use kaspasim: even though coin-kaspa hardcodes kaspa: everywhere else.
 */
export function toSimnetAddress(kaspaAddr: string): string {
  const { version, publicKey } = addressToPublicKey(kaspaAddr);
  return encodeKaspaAddress("kaspasim", version, publicKey);
}
