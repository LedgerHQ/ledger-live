import { AccountIdentifier } from "@icp-sdk/canisters/ledger/icp";

/**
 * Validates if a string is a valid ICP address (account identifier).
 * ICP addresses are 32-byte (64 hex chars) account identifiers.
 * @param address - The address hex string to validate
 * @returns An object with isValid boolean and optional error message
 */
export function validateAddress(address: string): { isValid: boolean; error?: string } {
  const defaultError = "Invalid address, account identifier could not be created.";

  try {
    // Let the dfinity library handle checksum validation
    const accId = AccountIdentifier.fromHex(address);
    if (!accId || !accId.toHex()) {
      return { isValid: false, error: defaultError };
    }

    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: e instanceof Error ? e.message || defaultError : defaultError };
  }
}

/**
 * Validates if a memo value is valid (non-negative integer).
 * @param memo - Optional memo string to validate
 * @returns An object with isValid boolean and optional error message
 */
export function validateMemo(memo?: string): { isValid: boolean; error?: string } {
  // If memo is undefined, default to 0 which is valid
  if (memo === undefined) {
    return { isValid: true };
  }

  // Empty string or whitespace-only is invalid
  if (memo.trim().length === 0) {
    return { isValid: false, error: "Memo cannot be empty or whitespace only" };
  }

  try {
    const res = BigInt(memo);

    if (res < 0) {
      return { isValid: false };
    }
    return { isValid: true };
  } catch (e) {
    const defaultError = "Invalid memo";
    return { isValid: false, error: e instanceof Error ? e.message || defaultError : defaultError };
  }
}
