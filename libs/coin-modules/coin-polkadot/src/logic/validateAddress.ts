import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { isValidAddress, getSs58Prefix } from "../common";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const ss58Format = getSs58Prefix(parameters.currencyId);
  return isValidAddress(address, ss58Format);
}
