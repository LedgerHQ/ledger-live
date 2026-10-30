import { Principal } from "@icp-sdk/core/principal";
import { MAX_NAT64 } from "../consts";
import { AccountIdentifier } from "./accountIdentifier";

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

// The checksum catches a mistyped identifier before funds go to an account nobody controls.
export const validateAddress = (address: string): ValidationResult =>
  AccountIdentifier.isValid(address)
    ? { isValid: true }
    : { isValid: false, error: "Invalid address, expected a 64-character account identifier." };

// The ledger transfer memo is a Nat64; reject negative or out-of-range values up front rather
// than letting Candid encoding fail at signing time.
export const validateMemo = (memo?: string): ValidationResult => {
  try {
    const value = BigInt(memo ?? 0);
    if (value < 0n || value > MAX_NAT64) {
      return { isValid: false };
    }
    return { isValid: true };
  } catch (e) {
    const defaultError = "Invalid memo";
    return { isValid: false, error: e instanceof Error ? e.message || defaultError : defaultError };
  }
};
