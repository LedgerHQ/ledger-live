import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { validateAddress as taquitoValidateAddress, ValidationResult } from "@taquito/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return taquitoValidateAddress(address) === ValidationResult.VALID;
}
