import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { isValidKaspaAddress } from "../logic";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidKaspaAddress(address);
}
