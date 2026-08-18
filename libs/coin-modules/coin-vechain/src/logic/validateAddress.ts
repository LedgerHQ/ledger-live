import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/index";
import { parseAddress } from "../common-logic";

// Validate a VeChain address. Kept in logic/ so api/ depends on the logic layer for validation
// like every other method, rather than reaching into common-logic directly.
export function isValidAddress(address: string): boolean {
  return parseAddress(address);
}

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
