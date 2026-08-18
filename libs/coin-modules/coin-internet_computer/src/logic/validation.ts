import { AccountIdentifier } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

type ValidationResult = { isValid: boolean; error?: string };

export const validatePrincipal = (principal: string): ValidationResult => {
  const defaultError = "Invalid principal";
  try {
    Principal.fromText(principal);
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: e instanceof Error ? e.message || defaultError : defaultError };
  }
};

export const validateAddress = (address: string): ValidationResult => {
  const defaultError = "Invalid address, account identifier could not be created.";
  try {
    const accId = AccountIdentifier.fromHex(address);
    if (!accId?.toHex()) {
      return { isValid: false, error: defaultError };
    }
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: e instanceof Error ? e.message || defaultError : defaultError };
  }
};

// The ledger transfer memo is a Nat64; reject negative or out-of-range values up front rather
// than letting Candid encoding fail at signing time.
const MAX_MEMO = 2n ** 64n - 1n;

export const validateMemo = (memo?: string): ValidationResult => {
  try {
    const value = BigInt(memo ?? 0);
    if (value < 0n || value > MAX_MEMO) {
      return { isValid: false };
    }
    return { isValid: true };
  } catch (e) {
    const defaultError = "Invalid memo";
    return { isValid: false, error: e instanceof Error ? e.message || defaultError : defaultError };
  }
};
