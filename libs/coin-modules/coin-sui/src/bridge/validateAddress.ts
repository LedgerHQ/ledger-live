import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isValidSuiAddress } from "@mysten/sui/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidSuiAddress(address);
}
