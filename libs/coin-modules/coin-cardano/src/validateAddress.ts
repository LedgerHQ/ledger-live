import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isValidAddress } from "./logic";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!parameters.networkId) {
    throw new Error("Missing networkId parameter on address validation for Cardano");
  }

  return isValidAddress(address, parameters.networkId);
}
