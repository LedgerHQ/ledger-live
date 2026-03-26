import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { validateAddress as utilsValidateAddress } from "./utils/addresses";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const validation = utilsValidateAddress(address);
  return validation.isValid;
}
