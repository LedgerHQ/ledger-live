/**
 * @file bip32.ts
 * @description BIP32 Path Handling for Bitcoin Wallets
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

export function pathStringToArray(path: string): number[] {
  return bippath.fromString(path).toPathArray();
}
