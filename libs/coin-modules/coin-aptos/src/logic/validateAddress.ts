import { AccountAddress } from "@aptos-labs/ts-sdk";
import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return AccountAddress.isValid({ input: address }).valid;
}
