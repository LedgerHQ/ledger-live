import type { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

export async function validateAddress(
  _address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  throw new Error("validateAddress is not supported");
}
