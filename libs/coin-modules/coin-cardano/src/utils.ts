import { log } from "@ledgerhq/logs";
import { utils as TyphonUtils, address as TyphonAddress } from "@stricahq/typhonjs";

/**
 * Safely converts a value to BigInt, returning 0n if conversion fails.
 * Prevents crashes from malformed API data (NaN, undefined, empty strings, null).
 */
export function safeBigInt(value: unknown): bigint {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
    return 0n;
  }
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

/**
 * Safely converts a timestamp to Date, returning epoch (1970-01-01) if invalid.
 * Prevents Invalid Date objects from malformed API data.
 */
export function safeDate(timestamp: unknown): Date {
  const date = new Date(
    typeof timestamp === "number" || typeof timestamp === "string" ? timestamp : 0,
  );
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

// Sentinel for addresses with no extractable payment credential (Reward / Byron / invalid).
// 28 bytes (56 hex chars) so it matches a real credential-hash length, avoiding accidental
// invalid-length keys and keeping comparisons/debugging consistent.
export const EMPTY_CREDENTIAL_KEY = "0".repeat(56);

/**
 * Normalizes a Cardano address from hex to bech32 format if needed.
 * Returns the address as-is if it's already bech32 (or can't be decoded as hex).
 */
export function normalizeAddress(address: string, isHexString: (s: string) => boolean): string {
  // An odd-length hex string would be silently truncated by Buffer.from(..., "hex"),
  // yielding a wrong address instead of failing — require an even length before decoding.
  if (isHexString(address) && address.length % 2 === 0) {
    try {
      return TyphonUtils.getAddressFromHex(Buffer.from(address, "hex")).getBech32();
    } catch (error) {
      log("cardano/utils", "Failed to normalize hex address", {
        address,
        error: error instanceof Error ? error.message : String(error),
      });
      return address;
    }
  }
  return address;
}

/**
 * Returns true if the address is a (parseable) Byron-era address. Byron addresses are valid
 * but expose no Shelley payment credential, so balance/UTXO derivation cannot support them —
 * callers should reject them rather than treat them as empty (see {@link extractPaymentKeyFromAddress}).
 */
export function isByronAddress(address: string): boolean {
  try {
    return TyphonUtils.getAddressFromString(address) instanceof TyphonAddress.ByronAddress;
  } catch {
    return false;
  }
}

/**
 * Extract the payment credential key hash from a Cardano address.
 * Supports Base, Enterprise, and Pointer addresses (Shelley era). Reward (stake) addresses
 * have no payment credential; Byron addresses are valid-but-unsupported (they carry no Shelley
 * payment credential); invalid addresses fail to parse. All of these return the empty
 * credential key — callers that must not misreport real balances should reject Byron addresses
 * explicitly (see {@link isByronAddress}) rather than treat them as "no funds".
 */
export function extractPaymentKeyFromAddress(address: string): string {
  try {
    const cardanoAddress = TyphonUtils.getAddressFromString(address);

    if (
      cardanoAddress instanceof TyphonAddress.BaseAddress ||
      cardanoAddress instanceof TyphonAddress.EnterpriseAddress ||
      cardanoAddress instanceof TyphonAddress.PointerAddress
    ) {
      return cardanoAddress.paymentCredential.hash.toString("hex");
    }

    // Reward (stake) addresses are a valid input that simply carries no payment credential —
    // expected, so don't flag them as unsupported. Only log genuinely unexpected types.
    if (!(cardanoAddress instanceof TyphonAddress.RewardAddress)) {
      log("cardano/utils", "Unsupported address type for payment key", {
        address,
        addressType: cardanoAddress.constructor.name,
      });
    }
    return EMPTY_CREDENTIAL_KEY;
  } catch (error) {
    log("cardano/utils", "Failed to extract payment key from address", {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    return EMPTY_CREDENTIAL_KEY;
  }
}

/**
 * Extract the stake credential key hash from a Cardano address.
 * Only Base and Reward addresses carry a stake credential. Returns undefined for
 * Enterprise, Pointer, Byron, or invalid addresses (no staking position resolvable).
 */
export function extractStakeKeyFromAddress(address: string): string | undefined {
  try {
    const cardanoAddress = TyphonUtils.getAddressFromString(address);

    if (
      cardanoAddress instanceof TyphonAddress.BaseAddress ||
      cardanoAddress instanceof TyphonAddress.RewardAddress
    ) {
      return cardanoAddress.stakeCredential.hash.toString("hex");
    }

    return undefined;
  } catch (error) {
    log("cardano/utils", "Failed to extract stake key from address", {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}
