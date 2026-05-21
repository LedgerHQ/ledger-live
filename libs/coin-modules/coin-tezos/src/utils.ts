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

/**
 * Reserve kept in the account when staking with useAllAmount on a delegated
 * account. The Tezos protocol rejects operations that would empty an implicit
 * delegated contract (`empty_implicit_delegated_contract`); this buffer covers
 * fees and leaves a small post-operation balance to satisfy the protocol.
 */
export const STAKE_USE_ALL_RESERVE_MUTEZ = 10_000n;

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
