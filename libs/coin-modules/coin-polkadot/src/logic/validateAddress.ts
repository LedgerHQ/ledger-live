import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { isValidAddress } from "../common";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
