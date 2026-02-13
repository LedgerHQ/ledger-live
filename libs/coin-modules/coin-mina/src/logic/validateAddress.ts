import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isValidAddress } from "./utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
