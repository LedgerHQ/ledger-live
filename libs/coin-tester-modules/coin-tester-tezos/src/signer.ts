import { ed25519 } from "@noble/curves/ed25519";
import { secp256k1 } from "@noble/curves/secp256k1";
import bs58 from "bs58";
import { blake2b } from "@noble/hashes/blake2b";
import { sha256 } from "@noble/hashes/sha2";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";

/**
 * Test signer matching the TezosSigner interface expected by the generic coin framework
 * (`live-common/families/tezos/signer.ts`).
 *
 * Implemented without `@taquito/signer` to avoid its UMD bundle's dependency on
 * `bn.js`, which is not available in Jest's module resolver.
 */
export type TezosTestSigner = {
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(
    path: string,
    rawTxHex: string,
    options?: { derivationMode?: string },
  ): Promise<string>;
};

/**
 * Standard Tezos base58check: prefix || payload || sha256(sha256(prefix || payload))[0:4]
 * then base58-encoded.
 */
function tezBase58Check(prefix: Uint8Array, payload: Uint8Array): string {
  const pl = new Uint8Array(prefix.length + payload.length);
  pl.set(prefix);
  pl.set(payload, prefix.length);
  const checksum = sha256(sha256(pl)).slice(0, 4);
  const out = new Uint8Array(pl.length + 4);
  out.set(pl);
  out.set(checksum, pl.length);
  return bs58.encode(out);
}

// Human-readable prefix bytes for Tezos encoding
// tz1 = Ed25519 public key hash
const TZ1_PREFIX = new Uint8Array([0x06, 0xa1, 0x9f]);
// tz2 = Secp256k1 public key hash
const TZ2_PREFIX = new Uint8Array([0x06, 0xa1, 0xa1]);

/**
 * Builds a test signer from a fresh BIP39 mnemonic.
 *
 * Key derivation deliberately skips SLIP-10 path derivation: the first 32
 * bytes of the BIP39 seed are used directly as the Ed25519 private key.
 * For testing purposes this is sufficient — the address is always valid and
 * the key can sign transactions that the local Flextesa node will accept.
 *
 * `signTransaction` receives `rawTxHex` from `rawEncode`, which already
 * includes the `0x03` manager watermark prefix. We must NOT add it again.
 * The signature (raw 64 bytes as hex) is returned and later appended to
 * the forged bytes by `combine()` (which also strips the watermark prefix).
 *
 * `getAddress` intentionally returns `publicKey` in the raw hex format that
 * the real Ledger Tezos app produces: a 33-byte buffer where the first byte
 * is the curve identifier (0x00 = Ed25519) followed by the 32-byte public
 * key. This ensures `normalizePublicKeyForAddress` in the production signer
 * is exercised by the coin tester, so regressions in that function are caught.
 */
export async function buildTz1Signer(): Promise<TezosTestSigner> {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic);
  const privateKey = seed.slice(0, 32);

  const pubKeyBytes = ed25519.getPublicKey(privateKey);
  const address = tezBase58Check(TZ1_PREFIX, blake2b(pubKeyBytes, { dkLen: 20 }));

  // The real Ledger Tezos app prepends the curve byte (0x00 for Ed25519) to
  // the 32-byte public key and returns the whole thing as a hex string.
  const publicKeyHex = Buffer.from([0x00, ...pubKeyBytes]).toString("hex");

  return {
    async getAddress(path: string) {
      // Return the hex form so normalizePublicKeyForAddress is exercised,
      // matching what hw-app-tezos returns from a real Ledger device.
      return { path, address, publicKey: publicKeyHex };
    },

    async signTransaction(_path: string, rawTxHex: string) {
      // rawTxHex is "03" + forged_bytes_hex (watermark already prepended by rawEncode)
      const txBytes = Buffer.from(rawTxHex.replace(/^0x/, ""), "hex");
      const hash = blake2b(txBytes, { dkLen: 32 });
      const signature = ed25519.sign(hash, privateKey);
      return Buffer.from(signature).toString("hex");
    },
  };
}

/**
 * Builds a test signer for tz2 (secp256k1) accounts.
 *
 * Uses the first 32 bytes of a BIP39 seed as the secp256k1 private key.
 * `getAddress` returns the compressed public key as a 33-byte hex string so
 * that `normalizePublicKeyForAddress` in the coin module encodes it as an sppk
 * base58 key, matching the format the real Ledger Tezos app produces.
 *
 * `signTransaction` produces a compact 64-byte r||s secp256k1 signature
 * (not DER), which is what the Tezos protocol expects after the DER→raw
 * conversion performed by `convertSecp256k1DERToRaw` in production.
 */
export async function buildTz2Signer(): Promise<TezosTestSigner> {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic);
  const privateKey = seed.slice(0, 32);

  const pubKeyBytes = secp256k1.getPublicKey(privateKey, true); // compressed, 33 bytes
  const address = tezBase58Check(TZ2_PREFIX, blake2b(pubKeyBytes, { dkLen: 20 }));

  // Return compressed public key as hex (33 bytes).
  // normalizePublicKeyForAddress will b58-encode it as sppk.
  const publicKeyHex = Buffer.from(pubKeyBytes).toString("hex");

  return {
    async getAddress(path: string) {
      return { path, address, publicKey: publicKeyHex };
    },

    async signTransaction(_path: string, rawTxHex: string) {
      const txBytes = Buffer.from(rawTxHex.replace(/^0x/, ""), "hex");
      const hash = blake2b(txBytes, { dkLen: 32 });
      const sig = secp256k1.sign(hash, privateKey);
      return Buffer.from(sig.toCompactRawBytes()).toString("hex");
    },
  };
}
