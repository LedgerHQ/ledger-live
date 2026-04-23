import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { parseAddress } from "../common-logic";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return parseAddress(address);
}
