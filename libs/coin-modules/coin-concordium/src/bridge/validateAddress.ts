import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { AccountAddress } from "@ledgerhq/concordium-core";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return AccountAddress.isValid(address);
}
