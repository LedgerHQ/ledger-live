import { DerivationType } from "@taquito/ledger-signer";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { validatePublicKey, ValidationResult, b58Encode, PrefixV2 } from "@taquito/utils";
import coinConfig from "./config";
import type { APIAccount } from "./network/types";
import type { TezosOperationMode } from "./types/model";

/**
 * Dust margin in mutez to prevent transaction failures on send max operations
 * This ensures a small safety buffer remains in the account after send max
 * Based on production behavior where ~281-287 mutez typically remain
 * Increased to 500 to handle edge cases and fee estimation variations
 */
export const DUST_MARGIN_MUTEZ = 500;

// Tezos rejects `empty_implicit_delegated_contract`; stake-max leaves this buffer.
export const STAKE_USE_ALL_RESERVE_MUTEZ = 10_000n;

/** Stake "Use Max": staked and unstaked-frozen funds count toward `balance` but aren't (re-)stakeable until finalized, so subtract both. */
export function computeMaxStakeAmount(
  balance: bigint,
  stakedBalance: bigint,
  unstakedBalance: bigint,
  fees: bigint,
): bigint {
  const { spendable: liquid } = partitionNativeBalance(balance, stakedBalance, unstakedBalance);
  const reserved = fees + STAKE_USE_ALL_RESERVE_MUTEZ;
  return liquid > reserved ? liquid - reserved : 0n;
}

/**
 * Splits a Tezos native balance (which includes frozen funds) into spendable and locked
 * (staked + unstaked). `locked` is clamped to `total` so spendable stays >= 0 across TzKT reorgs.
 */
export function partitionNativeBalance(
  total: bigint,
  staked: bigint,
  unstaked: bigint,
): { spendable: bigint; locked: bigint } {
  const frozen = staked + unstaked;
  const locked = frozen > total ? total : frozen;
  return { spendable: total - locked, locked };
}

/**
 * Suggested fee returned by Taquito for a minimal amount pre-estimation (mutez)
 * Used as a stable fallback for send-max when RPC estimation is unavailable.
 */
export const MIN_SUGGESTED_FEE_SMALL_TRANSFER = 489;

/**
 * Typical operation size (bytes) for a simple XTZ transfer used to approximate
 * the increased fee component when computing send-max in fallback mode.
 * Chosen to match Taquito’s behavior closely in integration tests.
 */
export const OP_SIZE_XTZ_TRANSFER = 154;

/** Minimal asset shape from `TransactionIntent` for FA2 detection */
export type TezosAssetLike = {
  type: string;
  assetReference?: string;
};

/**
 * Parse FA1.2 / FA2 token contract + token id from coin-framework `assetReference`
 * (`KT1…` or `KT1…:tokenId` as produced by getBlock / listOperations).
 */
export function parseTezosTokenAsset(
  asset: TezosAssetLike | undefined,
): { contractAddress: string; tokenId: number } | null {
  if (!asset || asset.type === "native") return null;
  const ref = asset.assetReference?.trim();
  if (!ref?.startsWith("KT1")) return null;

  const colonIdx = ref.lastIndexOf(":");
  if (colonIdx > 0) {
    const contractAddress = ref.slice(0, colonIdx);
    const tokenId = Number(ref.slice(colonIdx + 1));
    if (!Number.isFinite(tokenId) || tokenId < 0) return null;
    return { contractAddress, tokenId };
  }

  return { contractAddress: ref, tokenId: 0 };
}

/**
 * Resolves Tezos operation mode from intent type and asset (native XTZ vs token).
 */
export function resolveTezosOperationMode(
  intentType: string,
  asset: TezosAssetLike | undefined,
): TezosOperationMode {
  const base = intentType as TezosOperationMode;
  if (base === "send" && parseTezosTokenAsset(asset) !== null) {
    return "send_token";
  }
  return base;
}

/**
 * Creates a mock signer for Taquito operations (estimation and crafting)
 */
export function createMockSigner(publicKeyHash: string, publicKey: string) {
  return {
    publicKeyHash: async () => publicKeyHash,
    publicKey: async () => publicKey,
    sign: () => Promise.reject(new Error("unsupported")),
    secretKey: () => Promise.reject(new Error("unsupported")),
  };
}

/**
 * Normalize a Tezos public key to base58 format (edpk/sppk/p2pk) based on the
 * sender address prefix (tz1/tz2/tz3). Accepts either an already base58-encoded
 * key or a hex key returned by the Ledger app. Returns undefined if input is
 * empty or cannot be parsed.
 */
export function normalizePublicKeyForAddress(
  maybeKey: string | undefined,
  address: string,
): string | undefined {
  if (!maybeKey) return undefined;

  // If it's already a valid base58 public key, keep it
  if (validatePublicKey(maybeKey) === ValidationResult.VALID) return maybeKey;

  // Attempt to convert hex → base58 according to address curve
  try {
    const pkHex = maybeKey.trim().toLowerCase();
    if (pkHex === "") return undefined;
    const keyBuf = Buffer.from(pkHex, "hex");

    // Choose curve/prefix from address tz1/tz2/tz3
    // default are values for tz1 and fallbacks to it
    let derivationType: DerivationType = DerivationType.ED25519;
    let prefix: PrefixV2 = PrefixV2.Ed25519PublicKey;

    if (address.startsWith("tz2")) {
      derivationType = DerivationType.SECP256K1;
      prefix = PrefixV2.Secp256k1PublicKey;
    } else if (address.startsWith("tz3")) {
      derivationType = DerivationType.P256;
      prefix = PrefixV2.P256PublicKey;
    }

    const RAW_ED25519_KEY_LENGTH = 32;
    const COMPRESSED_SEC1_LENGTH = 33;
    const UNCOMPRESSED_SEC1_LENGTH = 65;
    const isEd25519 = derivationType === DerivationType.ED25519;
    if (isEd25519) {
      if (keyBuf.length === COMPRESSED_SEC1_LENGTH) {
        return b58Encode(keyBuf.slice(1), prefix);
      }
      if (keyBuf.length !== RAW_ED25519_KEY_LENGTH) {
        return undefined;
      }
      return b58Encode(keyBuf, prefix);
    }
    if (keyBuf.length === UNCOMPRESSED_SEC1_LENGTH) {
      return b58Encode(compressPublicKey(keyBuf, derivationType), prefix);
    }
    return b58Encode(keyBuf, prefix);
  } catch {
    return undefined;
  }
}

/**
 * Converts a DER-encoded secp256k1/P-256 ECDSA signature (returned by the Tezos Ledger
 * app for tz2/tz3 accounts) to the raw 64-byte r||s format the Tezos protocol expects.
 * Format: 0x30 <totalLen> 0x02 <rLen> <r_bytes> 0x02 <sLen> <s_bytes>
 */
export function convertSecp256k1DERToRaw(derHex: string): string {
  if (!/^[0-9a-fA-F]+$/.test(derHex) || derHex.length % 2 !== 0) {
    throw new Error("Tezos: device returned an invalid signature");
  }
  const buf = Buffer.from(derHex, "hex");
  if (buf.length === 64) return derHex; // already raw r||s

  const rStart = 4;
  const rLen = buf[3];
  const sLenIdx = rStart + rLen + 1;
  const sLen = buf[sLenIdx];
  const sStart = sLenIdx + 1;
  const malformed =
    buf.length < 8 ||
    buf[0] !== 0x30 ||
    buf[2] !== 0x02 ||
    buf[sLenIdx - 1] !== 0x02 ||
    rLen === 0 ||
    sLen === 0 ||
    rLen > 33 ||
    sLen > 33 ||
    sStart + sLen !== buf.length;
  if (malformed) {
    throw new Error("Tezos: device returned an invalid signature");
  }

  const raw = Buffer.concat([
    normalizeTo32Bytes(buf.slice(rStart, rStart + rLen)),
    normalizeTo32Bytes(buf.slice(sStart, sStart + sLen)),
  ]).toString("hex");
  // A 33-byte r/s is only valid DER when left-padded with 0x00; anything else normalises
  // to a non-64-byte result and is not a usable signature.
  if (raw.length !== 128) {
    throw new Error("Tezos: device returned an invalid signature");
  }
  return raw;
}

export function normalizeTo32Bytes(bytes: Buffer): Buffer {
  if (bytes.length === 33 && bytes[0] === 0x00) return bytes.slice(1);
  if (bytes.length < 32) {
    const padded = Buffer.alloc(32, 0);
    bytes.copy(padded, 32 - bytes.length);
    return padded;
  }
  return bytes;
}

/**
 * Creates default fallback estimation values
 */
export function createFallbackEstimation() {
  const config = coinConfig.getCoinConfig();
  return {
    fees: BigInt(config.fees.minEstimatedFees),
    gasLimit: BigInt(config.fees.minGasLimit),
    storageLimit: BigInt(config.fees.minStorageLimit),
    estimatedFees: BigInt(config.fees.minEstimatedFees),
  };
}

export function hasEmptyBalance(account: APIAccount) {
  return (account.type === "user" && account.balance === 0) || account.type === "empty";
}
