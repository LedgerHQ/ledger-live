import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { validateAddress as networkValidateAddress } from "../network";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return networkValidateAddress(address);
}
