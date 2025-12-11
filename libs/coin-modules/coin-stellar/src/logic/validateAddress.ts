import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isAddressValid } from "./utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isAddressValid(address);
}
