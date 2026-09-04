/**
 * Local, device-free Zcash signer for the coin tester. Implements
 * `@ledgerhq/coin-zcash`'s own 4-method local-signer contract
 * (`types/signer.ts`'s `BitcoinSigner`) -- not the broader 7-method
 * `@ledgerhq/live-signer-zcash` `ZcashSigner`, which only serves coin-bitcoin's
 * legacy PSBT path.
 *
 * Every signature comes from `@ledgerhq/zcash-utils`'s test-only NAPI surface
 * (`testDeriveKeys`/`testSignPczt`/`orchardAddressFromUfvk`); the only local
 * crypto is the plain hardened+non-hardened BIP32 private-key derivation
 * `getAddress` needs (`derivePath` below) and the Base58Check P2PKH address
 * encoding, both self-contained (no secp256k1 point *addition*, unlike
 * coin-tester-bitcoin's signer, is ever needed here: deriving from a full
 * private-key chain never needs the public-only CKD math coin-tester-bitcoin's
 * `eccWrapper` exists for).
 */
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { hmac } from "@noble/hashes/hmac";
import { sha256 as nobleSha256, sha512 } from "@noble/hashes/sha2";
import { ripemd160 as nobleRipemd160 } from "@noble/hashes/legacy";
import { secp256k1 } from "@noble/curves/secp256k1";
import bs58 from "bs58";
import { orchardAddressFromUfvk, testDeriveKeys, testSignPczt } from "@ledgerhq/zcash-utils";
import type { BitcoinSigner } from "@ledgerhq/coin-zcash/types/signer";
import type {
  PcztTransaction,
  SignPcztTransactionResult,
  ZcashAddress,
  ZcashShieldedAddress,
  ZcashViewKey,
} from "@ledgerhq/live-signer-zcash";
import { getCapturedPcztHex } from "./zcashClientTestSeam";

// Matches zcash_regtest's `bitcoinLikeInfo.P2PKH` (domain/entity/currency-crypto) --
// deliberately the mainnet Zcash version byte, not Zcash's own testnet/regtest one.
// See that file for why: @ledgerhq/coin-zcash's recipient classifier only accepts
// mainnet-prefixed addresses.
export const P2PKH_VERSION = 7352;

// `testDeriveKeys`/`testSignPczt`/`orchardAddressFromUfvk` all key off this network
// string; "mainnet" keeps the derived UFVK/addresses within coin-zcash's own
// mainnet-only classifier (see zcash_regtest.ts).
const ZCASH_UTILS_NETWORK = "mainnet";

const HARDENED_OFFSET = 0x80000000;

function parsePathSegment(segment: string): number {
  const hardened = segment.endsWith("'") || segment.endsWith("h") || segment.endsWith("H");
  const digits = hardened ? segment.slice(0, -1) : segment;
  if (!/^\d+$/.test(digits)) {
    throw new Error(`invalid BIP32 path segment: "${segment}"`);
  }
  const index = parseInt(digits, 10);
  return hardened ? index + HARDENED_OFFSET : index;
}

function parsePath(path: string): number[] {
  return (
    path
      .split("/")
      .map(segment => segment.trim())
      .filter(Boolean)
      // A leading "m" (root marker) is the standard BIP32 notation but not
      // itself a derivation index; every other segment must parse as one.
      .filter(segment => segment.toLowerCase() !== "m")
      .map(parsePathSegment)
  );
}

function ser32(i: number): Uint8Array {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, i, false);
  return buf;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

function bigIntTo32Bytes(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

type Bip32Node = { privateKey: Uint8Array; chainCode: Uint8Array };

function masterNodeFromSeed(seed: Uint8Array): Bip32Node {
  const digest = hmac(sha512, new TextEncoder().encode("Bitcoin seed"), seed);
  return { privateKey: digest.slice(0, 32), chainCode: digest.slice(32, 64) };
}

/** BIP32 CKDpriv -- works identically for hardened and non-hardened indices
 * because the full private key (not just an xpub) is always in hand. */
function deriveChild(parent: Bip32Node, index: number): Bip32Node {
  const hardened = index >= HARDENED_OFFSET;
  const data = new Uint8Array(37);
  if (hardened) {
    data.set([0x00], 0);
    data.set(parent.privateKey, 1);
  } else {
    data.set(secp256k1.getPublicKey(parent.privateKey, true), 0);
  }
  data.set(ser32(index), 33);

  const digest = hmac(sha512, parent.chainCode, data);
  const il = digest.slice(0, 32);
  const childPrivateKey = bigIntTo32Bytes(
    (bytesToBigInt(il) + bytesToBigInt(parent.privateKey)) % secp256k1.CURVE.n,
  );
  return { privateKey: childPrivateKey, chainCode: digest.slice(32, 64) };
}

export function derivePath(seed: Uint8Array, path: string): Bip32Node {
  return parsePath(path).reduce(deriveChild, masterNodeFromSeed(seed));
}

function hash160(data: Uint8Array): Uint8Array {
  return nobleRipemd160(nobleSha256(data));
}

/** Base58Check of the 22-byte {2-byte version BE}{20-byte hash160} payload --
 * Zcash's own P2PKH encoding (`t1...`), per `wallet-btc/crypto/zec.ts`. */
export function p2pkhAddress(privateKey: Uint8Array): string {
  const pubKey = secp256k1.getPublicKey(privateKey, true);
  const hash = hash160(pubKey);
  const payload = new Uint8Array(22);
  new DataView(payload.buffer).setUint16(0, P2PKH_VERSION, false);
  payload.set(hash, 2);
  const checksum = nobleSha256(nobleSha256(payload)).slice(0, 4);
  const full = new Uint8Array(26);
  full.set(payload, 0);
  full.set(checksum, 22);
  return bs58.encode(Buffer.from(full));
}

export type ZcashTestSigner = {
  signer: BitcoinSigner;
  mnemonic: string;
  ufvk: string;
  xpub: string;
  accountIndex: number;
};

/**
 * Builds a deterministic in-memory Zcash signer for a single test account
 * (`accountIndex`, default 0). All 4 methods are pure/local; `signPcztTransaction`
 * retrieves the hex of the PCZT it is asked to sign from the test seam
 * (`zcashClientTestSeam.ts`), since the parsed `PcztTransaction` argument alone
 * doesn't carry it.
 */
export function buildSigner(accountIndex = 0): ZcashTestSigner {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic);
  const { ufvk, xpub } = testDeriveKeys(mnemonic, accountIndex, ZCASH_UTILS_NETWORK);

  const signer: BitcoinSigner = {
    getAddress: async (path: string, _display?: boolean): Promise<ZcashAddress> => {
      const node = derivePath(seed, path);
      return {
        address: p2pkhAddress(node.privateKey),
        publicKey: Buffer.from(secp256k1.getPublicKey(node.privateKey, true)).toString("hex"),
        chainCode: Buffer.from(node.chainCode).toString("hex"),
      };
    },
    getFullViewingKey: async (_path: string): Promise<ZcashViewKey> => ({ viewKey: ufvk }),
    getShieldedAddress: async (
      _path: string,
      _display?: boolean,
    ): Promise<ZcashShieldedAddress> => ({
      address: orchardAddressFromUfvk(ufvk),
    }),
    signPcztTransaction: async (_pczt: PcztTransaction): Promise<SignPcztTransactionResult> => {
      const pcztHex = getCapturedPcztHex(accountIndex);
      const result = await testSignPczt(mnemonic, accountIndex, ZCASH_UTILS_NETWORK, pcztHex);
      return {
        orchard: result.orchardSignatures.map(hex => ({
          spendAuthSig: new Uint8Array(Buffer.from(hex, "hex")),
        })),
        ironwood: result.ironwoodSignatures.map(hex => ({
          spendAuthSig: new Uint8Array(Buffer.from(hex, "hex")),
        })),
        transparentInputSigs: result.transparentSignatures.map(
          hex => new Uint8Array(Buffer.from(hex, "hex")),
        ),
      };
    },
  };

  return { signer, mnemonic, ufvk, xpub, accountIndex };
}
