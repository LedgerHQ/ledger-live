import { secp256k1 } from "@noble/curves/secp256k1";
import { blake2b } from "@noble/hashes/blake2b";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { fromPublicKey } from "iso-filecoin/address";
import { concat } from "iso-base/utils";
import type {
  FilecoinGetAddrResponse,
  FilecoinSignature,
  FilecoinSigner,
} from "@ledgerhq/coin-filecoin/types/signer";

// CID prefix for dag-cbor + blake2b-256 (varint-encoded multihash)
const CID_PREFIX = Uint8Array.from([0x01, 0x71, 0xa0, 0xe4, 0x02, 0x20]);

/**
 * Derives a secp256k1 key pair from a BIP39 mnemonic using BIP32 HD derivation.
 * Path: m/44'/461'/0'/0/0 (standard Filecoin BIP44 path)
 */
async function deriveKeypair(mnemonic: string): Promise<{
  privateKey: Uint8Array;
  pubKeyUncompressed: Uint8Array;
  pubKeyCompressed: Uint8Array;
}> {
  // Use @scure/bip32 HDKey for proper BIP32 derivation (same as iso-filecoin/wallet)
  const { HDKey } = await import("@scure/bip32");
  const seed = mnemonicToSeedSync(mnemonic);
  const masterKey = HDKey.fromMasterSeed(seed);
  const derived = masterKey.derive("m/44'/461'/0'/0/0");

  if (!derived.privateKey) {
    throw new Error("Failed to derive private key");
  }

  const privateKey = derived.privateKey;
  const pubKeyUncompressed = secp256k1.getPublicKey(privateKey, false); // 65 bytes
  const pubKeyCompressed = secp256k1.getPublicKey(privateKey, true); // 33 bytes

  return { privateKey, pubKeyUncompressed, pubKeyCompressed };
}

/**
 * Signs a CBOR-serialized Filecoin message following the Filecoin signing spec:
 * 1. blake2b-256 of the raw CBOR message
 * 2. Prepend CID v1 prefix (dag-cbor + blake2b-256 multicodec)
 * 3. blake2b-256 of the CID bytes
 * 4. secp256k1 sign the final digest
 * 5. Return compact signature (r[32] || s[32] || v[1]) = 65 bytes
 *
 * Reference: iso-filecoin/src/wallet.js `sign()` function
 */
function filecoinSign(
  privateKey: Uint8Array,
  message: Uint8Array,
): { signature_compact: Uint8Array; signature_der: Uint8Array } {
  // Step 1: blake2b-256 of raw message
  const msgHash = blake2b(message, { dkLen: 32 });

  // Step 2: build CID = prefix || msgHash
  const cid = concat([CID_PREFIX, msgHash]);

  // Step 3: blake2b-256 of CID → this is what gets signed
  const digest = blake2b(cid, { dkLen: 32 });

  // Step 4: secp256k1 sign
  const sig = secp256k1.sign(digest, privateKey);

  // Step 5: compact format (r || s || recovery) = 65 bytes
  const compact = sig.toCompactRawBytes(); // 64 bytes
  const signature_compact = new Uint8Array(65);
  signature_compact.set(compact, 0);
  signature_compact[64] = sig.recovery ?? 0;

  return { signature_compact, signature_der: sig.toDERRawBytes() };
}

export type FilecoinTestSigner = FilecoinSigner;

/**
 * Builds a test signer from a fresh BIP39 mnemonic.
 * Returns both the signer and the derived f1 address so callers can fund it.
 */
export async function buildFilecoinSigner(): Promise<{
  signer: FilecoinTestSigner;
  address: string;
  mnemonic: string;
}> {
  const mnemonic = generateMnemonic();
  const { privateKey, pubKeyUncompressed, pubKeyCompressed } = await deriveKeypair(mnemonic);

  // f1 address for the coin module (mainnet prefix expected by Ledger Live)
  const addr = fromPublicKey(pubKeyUncompressed, "mainnet", "SECP256K1");
  const addrString = addr.toString();
  const addrByte = new Uint8Array(addr.toBytes());

  const addrResponse: FilecoinGetAddrResponse = {
    addrByte,
    addrString,
    compressed_pk: pubKeyCompressed,
  };

  const signer: FilecoinTestSigner = {
    async getAddressAndPubKey(_path: string): Promise<FilecoinGetAddrResponse> {
      return addrResponse;
    },

    async showAddressAndPubKey(_path: string): Promise<FilecoinGetAddrResponse> {
      return addrResponse;
    },

    async sign(_path: string, message: Uint8Array): Promise<FilecoinSignature> {
      const { signature_compact, signature_der } = filecoinSign(privateKey, message);
      return { signature_compact, signature_der };
    },
  };

  return { signer, address: addrString, mnemonic };
}
