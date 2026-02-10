import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { validateAddress as zondaxValidateAddress } from "../dfinity/validation";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const result = await zondaxValidateAddress(address);
  return result.isValid;
}
