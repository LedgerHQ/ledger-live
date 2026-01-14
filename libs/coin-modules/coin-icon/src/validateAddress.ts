import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isValidAddress } from "./logic";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
