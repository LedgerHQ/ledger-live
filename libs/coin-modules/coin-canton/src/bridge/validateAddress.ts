import { isRecipientValid } from "../common-logic";
import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isRecipientValid(address);
}
