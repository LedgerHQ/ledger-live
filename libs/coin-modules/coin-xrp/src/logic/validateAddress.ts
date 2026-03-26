import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { isValidClassicAddress } from "ripple-address-codec";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidClassicAddress(address);
}
