/**
 * @file bip32.ts
 * @description BIP32 Path Handling for Aptos Wallets
 *
 * This file provides utility functions to handle BIP32 paths,
 * which are commonly used in hierarchical deterministic (HD) wallets.
 * It includes functions to convert BIP32 paths to and from different formats,
 * extract components from extended public keys (xpubs), and manipulate path elements.
 */

import bippath from "bip32-path";

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

/**
 * Parse a BIP32 path with bip32-path, failing closed on truncated/garbage segments
 * that bip32-path would silently shorten (e.g. "12abc'" → 12).
 */
export function pathStringToArray(path: string): number[] {
  const __segments = path.split("/");
  for (const [__i, segment] of __segments.entries()) {
    // bip32-path accepts and strips a leading "m" root; mirror that.
    if (__i === 0 && /^m$/i.test(segment)) {
      continue;
    }
    if (!/^\d+[hH']?$/.test(segment)) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
    if (parseInt(segment, 10) > 0x7fffffff) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
  }
  return bippath.fromString(path).toPathArray();
}
