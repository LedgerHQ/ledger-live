import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { isValidSuiAddress } from "@mysten/sui/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidSuiAddress(address);
}
