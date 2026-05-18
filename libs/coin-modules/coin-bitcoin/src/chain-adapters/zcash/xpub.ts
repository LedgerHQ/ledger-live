/**
 * NOTE:
 * THIS CODE SHOULD BE MOVED INTO THE DMK AND IDEALLY KEPT LOCAL TO THE DMK SIGNER KIT TO BE SHARED WITH OTHER SIGNERS.
 * WHEN ZCASH SIGNER EXPOSES A NATIVE XPUB COMMAND, THIS CODE SHOULD BE REMOVED.
 * IT IS ONLY USED AS A TEMPORARY MEASURE TO ENABLE ZCASH SUPPORT WITH THE DMK SIGNER KIT.
 * IT WILL BE REMOVED IN A FUTURE RELEASE.
 *
 * Compose a BIP32 extended public key (xpub) string from raw key material.
 *
 * Mirrors the algorithm used by `hw-app-btc` `BtcOld.getWalletXpub`, kept local
 * to the zcash adapter because the new `DmkSignerZcash` (DMK signer kit) only
 * exposes `getAddress` and not a native xpub command.
 *
 * Both `publicKey` arguments accept either uncompressed (65 bytes, 0x04 prefix)
 * or already-compressed (33 bytes) SECP256K1 keys. Inputs are hex strings.
 */

import bs58 from "bs58";
import { sha256 as nobleSha256 } from "@noble/hashes/sha2";
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy";

export function composeXpub(args: {
  xpubVersion: number;
  depth: number;
  /** Hardened BIP32 child index of `accountPublicKey` under its parent. */
  childNumber: number;
  parentPublicKeyHex: string;
  accountPublicKeyHex: string;
  accountChainCodeHex: string;
}): string {
  const {
    xpubVersion,
    depth,
    childNumber,
    parentPublicKeyHex,
    accountPublicKeyHex,
    accountChainCodeHex,
  } = args;

  const parentFingerprint = makeFingerprint(
    compressPublicKeySECP256(Buffer.from(parentPublicKeyHex, "hex")),
  );
  const accountPubKey = compressPublicKeySECP256(Buffer.from(accountPublicKeyHex, "hex"));
  const chainCode = Buffer.from(accountChainCodeHex, "hex");

  const indexBuffer = asBufferUInt32BE(childNumber);
  // Force hardened bit since LL account paths are always hardened (e.g. m/44'/133'/0').
  indexBuffer[0] |= 0x80;

  const extendedKeyBytes = Buffer.concat([
    asBufferUInt32BE(xpubVersion),
    Buffer.from([depth]),
    parentFingerprint,
    indexBuffer,
    chainCode,
    accountPubKey,
  ]);
  const checksum = hash256(extendedKeyBytes).slice(0, 4);
  return bs58.encode(Buffer.concat([extendedKeyBytes, checksum]));
}

function asBufferUInt32BE(n: number): Buffer {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32BE(n, 0);
  return buf;
}

function compressPublicKeySECP256(publicKey: Buffer): Buffer {
  if (publicKey.length === 33) return publicKey;
  if (publicKey.length !== 65) {
    throw new Error(
      `Unexpected SECP256K1 public key length: expected 33 or 65 bytes, got ${publicKey.length}`,
    );
  }
  return Buffer.concat([Buffer.from([0x02 + (publicKey[64] & 0x01)]), publicKey.slice(1, 33)]);
}

function makeFingerprint(compressedPubKey: Buffer): Buffer {
  return hash160(compressedPubKey).slice(0, 4);
}

function sha256(buffer: Buffer): Buffer {
  return Buffer.from(nobleSha256(buffer));
}
function hash256(buffer: Buffer): Buffer {
  return sha256(sha256(buffer));
}
function ripemd160(buffer: Buffer): Buffer {
  return Buffer.from(nobleRipemd160(buffer));
}
function hash160(buffer: Buffer): Buffer {
  return ripemd160(sha256(buffer));
}
