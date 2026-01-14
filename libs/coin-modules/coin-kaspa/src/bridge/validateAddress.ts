import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isValidKaspaAddress } from "../logic";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidKaspaAddress(address);
}
