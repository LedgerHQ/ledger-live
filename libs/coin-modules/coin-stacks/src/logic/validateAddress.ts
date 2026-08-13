import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/index";
import { validateAddress as isValidStacksAddress } from "../bridge/utils/addresses";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidStacksAddress(address).isValid;
}
