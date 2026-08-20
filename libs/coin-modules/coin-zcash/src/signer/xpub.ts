/**
 * Compose a BIP32 extended public key (xpub) string from raw key material, and
 * read the account key material back out of one (`accountPubkeyFromXpub`).
 *
 * Mirrors the algorithm used by `hw-app-btc` `BtcOld.getWalletXpub`, kept local
 * because the `DmkSignerZcash` signer kit only exposes `getAddress` and not a
 * native xpub command. TODO: delete this in favour of that command once the DMK
 * exposes it, where the logic belongs and can be shared with other signers.
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

/**
 * Extract the account-level transparent key material from an xpub: the 32-byte
 * chain code followed by the 33-byte compressed public key, hex-encoded.
 *
 * These 65 bytes are what a ZIP-316 UFVK carries as its transparent (P2PKH)
 * item, and all the PCZT builder needs to derive the internal change address and
 * to verify each transparent input's signing path. Deriving them from the xpub
 * the account already holds is what lets a transparent send proceed without a
 * UFVK, whose export costs a device confirmation.
 *
 * The BIP-32 metadata dropped here (version, depth, parent fingerprint, child
 * number) plays no part in child derivation, and a UFVK does not preserve it
 * either.
 *
 * wallet-btc reads the same two fields at the same offsets on its way to a
 * derived child key (`crypto/base.ts`'s `getPubkeyAt`), but exposes neither them
 * nor the account-level pair, hence this local reader — the counterpart of
 * `composeXpub` above, which produces the xpub in the first place.
 */
export function accountPubkeyFromXpub(xpub: string): string {
  const decoded = Buffer.from(bs58.decode(xpub));
  // 4 version + 1 depth + 4 fingerprint + 4 child number + 32 chain code
  // + 33 key + 4 checksum.
  if (decoded.length !== 82) {
    throw new Error(`Unexpected xpub length: expected 82 bytes, got ${decoded.length}`);
  }
  if (!hash256(decoded.subarray(0, 78)).subarray(0, 4).equals(decoded.subarray(78))) {
    throw new Error("Invalid xpub: checksum mismatch");
  }
  const publicKey = decoded.subarray(45, 78);
  if (publicKey[0] !== 0x02 && publicKey[0] !== 0x03) {
    throw new Error(
      `Invalid xpub: expected a compressed public key (0x02/0x03 prefix), got 0x${publicKey[0]
        .toString(16)
        .padStart(2, "0")}`,
    );
  }
  return decoded.subarray(13, 78).toString("hex");
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
