import { isValidAddress } from "@celo/utils/lib/address";
import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address);
}
