import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { validateAddress as networkValidateAddress } from "../network/addresses";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return networkValidateAddress(address).isValid;
}
