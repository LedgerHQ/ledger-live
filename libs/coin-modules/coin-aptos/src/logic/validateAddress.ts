import { AccountAddress } from "@aptos-labs/ts-sdk";
import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return AccountAddress.isValid({ input: address }).valid;
}
