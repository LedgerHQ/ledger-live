import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/index";

import { isValidAddress } from "../logic";

/**
 * Validates a MultiversX bech32 address (erd1...).
 * @param address - The address to validate
 * @returns true if the address is a valid MultiversX address
 */
export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
