import type { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { AccountAddress } from "@ledgerhq/concordium-core";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return AccountAddress.isValid(address);
}
