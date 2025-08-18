import { validatePublicKey, ValidationResult, b58Encode, PrefixV2 } from "@taquito/utils";

/**
 * Default limits and fees for Tezos operations
 */
// Safe fallback values aligned with Taquito estimation defaults for a simple transfer
// These are used when network estimation is unavailable (e.g., signer not configured)
const DEFAULT_LIMITS = {
  GAS: 2169n,
  STORAGE: 277n,
  BASE_FEE: 491n,
};

/**
 * Dust margin in mutez to prevent transaction failures on send max operations
 * This ensures a small safety buffer remains in the account after send max
 * Based on production behavior where ~281-287 mutez typically remain
 * Increased to 500 to handle edge cases and fee estimation variations
 */
export const DUST_MARGIN_MUTEZ = 500;

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

/**
 * Helper function to map generic staking intents to Tezos operation modes
 */
export function mapIntentTypeToTezosMode(intentType: string): "send" | "delegate" | "undelegate" {
  switch (intentType) {
    case "stake":
      return "delegate";
    case "unstake":
      return "undelegate";
    default:
      return intentType as "send" | "delegate" | "undelegate";
  }
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
    if (address.startsWith("tz1")) {
      return processKeyForCurve(keyBuf, "ed25519");
    } else if (address.startsWith("tz2")) {
      return processKeyForCurve(keyBuf, "secp256k1");
    } else if (address.startsWith("tz3")) {
      return processKeyForCurve(keyBuf, "p256");
    } else {
      // Fallback to ed25519 when address prefix is unexpected
      return processKeyForCurve(keyBuf, "ed25519");
    }
  } catch {
    return undefined;
  }
}

function compressKey(keyBuf: Buffer): Buffer {
  if (keyBuf.length === 65 && keyBuf[0] === 0x04) {
    const parity = keyBuf[64] & 1;
    return Buffer.concat([Buffer.from([0x02 + parity]), keyBuf.slice(1, 33)]);
  }
  return keyBuf;
}

function processKeyForCurve(
  keyBuf: Buffer,
  curveType: "ed25519" | "secp256k1" | "p256",
): string | undefined {
  let processedKey: Buffer;
  let expectedLength: number;
  let prefix: PrefixV2;

  switch (curveType) {
    case "ed25519":
      // For ed25519, hardware often returns 32-byte raw key (64 hex)
      // If a 33-byte buffer is provided (leading 0x00), drop the first byte
      processedKey = keyBuf.length === 33 && keyBuf[0] === 0x00 ? keyBuf.slice(1) : keyBuf;
      expectedLength = 32;
      prefix = PrefixV2.Ed25519PublicKey;
      break;
    case "secp256k1":
      processedKey = compressKey(keyBuf);
      expectedLength = 33;
      prefix = PrefixV2.Secp256k1PublicKey;
      break;
    case "p256":
      processedKey = compressKey(keyBuf);
      expectedLength = 33;
      prefix = PrefixV2.P256PublicKey;
      break;
  }

  if (processedKey.length !== expectedLength) return undefined;
  return b58Encode(processedKey, prefix);
}

/**
 * Creates default fallback estimation values
 */
export function createFallbackEstimation() {
  return {
    fees: DEFAULT_LIMITS.BASE_FEE,
    gasLimit: DEFAULT_LIMITS.GAS,
    storageLimit: DEFAULT_LIMITS.STORAGE,
    estimatedFees: DEFAULT_LIMITS.BASE_FEE,
  };
}
