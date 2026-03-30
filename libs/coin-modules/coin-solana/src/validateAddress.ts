import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { isValidBase58Address } from "./logic";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidBase58Address(address);
}
