import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha2";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "bip39";
import bs58check from "bs58check";
import type { TronAddress, TronSignature, TronSigner } from "@ledgerhq/coin-tron/types";

/**
 * Test signer implementing the `TronSigner` interface from
 * `@ledgerhq/coin-tron/types`. Derives keys from a BIP39 mnemonic via BIP32
 * (secp256k1), encodes Tron addresses, and signs raw transaction digests.
 * No hardware-wallet path, no Speculos.
 */
export type TronTestSigner = TronSigner & {
  /** Returns the raw private key — used by funding helpers that sign outside the bridge. */
  getPrivateKey(path: string): Uint8Array;
};

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/**
 * Tron address: keccak256(uncompressedPubKey[1:]) → last 20 bytes →
 * prepend 0x41 → base58check.
 * @see https://developers.tron.network/docs/account
 */
function pubKeyToAddress(pubKey: Uint8Array): string {
  // pubKey is the 65-byte uncompressed public key (0x04 || X || Y). Drop the prefix.
  const xy = pubKey.length === 65 ? pubKey.slice(1) : pubKey;
  const hash = keccak_256(xy);
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash.slice(-20), 1);
  return bs58check.encode(addressBytes);
}

export function buildTronSigner(mnemonic: string): TronTestSigner {
  const seed = mnemonicToSeedSync(mnemonic);
  const root = HDKey.fromMasterSeed(seed);

  function derive(path: string) {
    // coin-tron passes paths without the leading "m/" — normalise.
    const normalised = path.startsWith("m/") ? path : `m/${path}`;
    const node = root.derive(normalised);
    if (!node.privateKey || !node.publicKey) {
      throw new Error(`Failed to derive ${path}`);
    }
    const uncompressed = secp256k1.ProjectivePoint.fromHex(node.publicKey).toRawBytes(false);
    return { privateKey: node.privateKey, publicKey: uncompressed };
  }

  async function getAddress(path: string, _boolDisplay?: boolean): Promise<TronAddress> {
    const { publicKey } = derive(path);
    return {
      publicKey: bytesToHex(publicKey),
      address: pubKeyToAddress(publicKey),
    };
  }

  async function sign(
    path: string,
    rawTxHex: string,
    _tokenSignatures: string[],
  ): Promise<TronSignature> {
    const { privateKey } = derive(path);
    const rawBytes = hexToBytes(rawTxHex);
    const digest = sha256(rawBytes);
    const sig = secp256k1.sign(digest, privateKey, { lowS: true });
    const compact = sig.toCompactRawBytes();
    const recovery = sig.recovery ?? 0;
    const out = new Uint8Array(65);
    out.set(compact, 0);
    out[64] = recovery;
    return bytesToHex(out);
  }

  function getPrivateKey(path: string): Uint8Array {
    return derive(path).privateKey;
  }

  return { getAddress, sign, getPrivateKey };
}
