import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/index";
import { decode, fromWords } from "bech32";

// Bech32 rules for MultiversX addresses. Implemented locally so the framework-agnostic
// logic/ layer does not depend on the legacy src/logic.ts (which pulls in Live types).
const HRP = "erd";
const PUBKEY_LENGTH = 32;

/**
 * Validate a MultiversX bech32 (erd1...) address: correct HRP and 32-byte public key.
 */
export function isValidAddress(address: string): boolean {
  try {
    const decoded = decode(address);
    if (decoded.prefix !== HRP) return false;
    return Buffer.from(fromWords(decoded.words)).length === PUBKEY_LENGTH;
  } catch {
    return false;
  }
}

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
