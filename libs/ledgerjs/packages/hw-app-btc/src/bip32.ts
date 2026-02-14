/**
 * @file bip32.ts
 * @description BIP32 Path Handling for Bitcoin Wallets
 *
 * This file provides utility functions to handle BIP32 paths,
 * which are commonly used in hierarchical deterministic (HD) wallets.
 * It includes functions to convert BIP32 paths to and from different formats,
 * extract components from extended public keys (xpubs), manipulate path elements,
 * and derive child public keys locally (for non-hardened derivation).
 */

import bippath from "bip32-path";
import bs58check from "bs58check";
import { secp256k1 } from "@noble/curves/secp256k1";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha2";

export function pathElementsToBuffer(paths: number[]): Buffer {
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}

export function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : pathStringToArray(path);
  return pathElementsToBuffer(pathElements);
}

export function pathArrayToString(pathElements: number[]): string {
  // Limitation: bippath can't handle and empty path. It shouldn't affect us
  // right now, but might in the future.
  // TODO: Fix support for empty path.
  return bippath.fromPathArray(pathElements).toString();
}

export function pathStringToArray(path: string): number[] {
  return bippath.fromString(path).toPathArray();
}

export function pubkeyFromXpub(xpub: string): Buffer {
  const xpubBuf = bs58check.decode(xpub);
  return xpubBuf.subarray(xpubBuf.length - 33);
}

export function getXpubComponents(xpub: string): {
  chaincode: Buffer;
  pubkey: Buffer;
  version: number;
} {
  const xpubBuf: Buffer = bs58check.decode(xpub);
  return {
    chaincode: xpubBuf.subarray(13, 13 + 32),
    pubkey: xpubBuf.subarray(xpubBuf.length - 33),
    version: xpubBuf.readUInt32BE(0),
  };
}

export function hardenedPathOf(pathElements: number[]): number[] {
  for (let i = pathElements.length - 1; i >= 0; i--) {
    if (pathElements[i] >= 0x80000000) {
      return pathElements.slice(0, i + 1);
    }
  }
  return [];
}

/**
 * Derives a child public key from a parent public key using BIP32 non-hardened derivation.
 * This allows deriving child keys locally without device interaction.
 *
 * @param parentPubkey - The parent compressed public key (33 bytes)
 * @param parentChaincode - The parent chaincode (32 bytes)
 * @param index - The child index (must be non-hardened, i.e., < 0x80000000)
 * @returns The derived child public key and chaincode
 * @throws Error if attempting hardened derivation or invalid inputs
 */
export function deriveChildPublicKey(
  parentPubkey: Buffer,
  parentChaincode: Buffer,
  index: number,
): { pubkey: Buffer; chaincode: Buffer } {
  // Validate parentPubkey is a compressed public key (33 bytes)
  if (parentPubkey.length !== 33) {
    throw new Error(`Invalid parent pubkey length: expected 33 bytes, got ${parentPubkey.length}`);
  }

  // Validate parentChaincode is 32 bytes
  if (parentChaincode.length !== 32) {
    throw new Error(
      `Invalid parent chaincode length: expected 32 bytes, got ${parentChaincode.length}`,
    );
  }

  // Validate index is a non-negative integer
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Invalid index: must be a non-negative integer, got ${index}`);
  }

  // Hardened derivation not possible from public key
  if (index >= 0x80000000) {
    throw new Error("Cannot derive hardened child from public key");
  }

  // I = HMAC-SHA512(Key = cpar, Data = serP(Kpar) || ser32(i))
  const data = Buffer.alloc(parentPubkey.length + 4);
  parentPubkey.copy(data, 0);
  data.writeUInt32BE(index, parentPubkey.length);

  const I = hmac(sha512, parentChaincode, data);
  const IL = I.subarray(0, 32);
  const IR = I.subarray(32);
  const tweak = BigInt(`0x${Buffer.from(IL).toString("hex")}`);
  const curveOrder = secp256k1.Point.CURVE().n;

  // BIP32 CKDpub invalid child cases:
  // - parse256(IL) >= n
  // - parse256(IL) == 0
  if (tweak === 0n || tweak >= curveOrder) {
    throw new Error(`Invalid child derivation at index ${index}`);
  }

  // Ki = point(parse256(IL)) + Kpar
  const parentPoint = secp256k1.Point.fromHex(parentPubkey);
  const tweakScalar = secp256k1.Point.Fn.fromBytes(IL);
  const tweakPoint = secp256k1.Point.BASE.multiply(tweakScalar);
  const childPoint = parentPoint.add(tweakPoint);
  if (childPoint.equals(secp256k1.Point.ZERO)) {
    throw new Error(`Invalid child derivation at index ${index}`);
  }

  return {
    pubkey: Buffer.from(childPoint.toBytes(true)),
    chaincode: Buffer.from(IR),
  };
}
