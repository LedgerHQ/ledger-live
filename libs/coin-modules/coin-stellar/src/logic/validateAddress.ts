import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { isAddressValid } from "./utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isAddressValid(address);
}
