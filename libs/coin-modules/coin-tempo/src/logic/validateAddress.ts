import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";

/**
 * Standard EVM address validation: 0x followed by 40 hex characters.
 */
export function isRecipientValid(recipient: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(recipient);
}

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isRecipientValid(address);
}
