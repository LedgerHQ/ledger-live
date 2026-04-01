import { isValidAddress } from "@celo/utils/lib/address";
import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
