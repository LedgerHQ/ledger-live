import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { isValidAddress } from "algosdk";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
