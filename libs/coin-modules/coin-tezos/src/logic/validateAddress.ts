import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { validateAddress as taquitoValidateAddress, ValidationResult } from "@taquito/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return taquitoValidateAddress(address) === ValidationResult.VALID;
}
