import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { isRecipientValid } from "./utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isRecipientValid(address);
}
