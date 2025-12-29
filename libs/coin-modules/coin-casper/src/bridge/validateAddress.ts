import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isAddressValid } from "./bridgeHelpers/addresses";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isAddressValid(address);
}
