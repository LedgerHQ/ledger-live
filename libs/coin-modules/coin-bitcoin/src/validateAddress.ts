import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isValidAddress } from "./wallet-btc/utils";
import { Currency } from "./wallet-btc";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!parameters.currencyId) {
    throw new Error("Missing currency parameter for address validation on Bitcoin");
  }

  // Snippet derived from `isValidRecipient` inside `./src/logic.ts`
  try {
    // Optimistically assume parameters.currencyId is an actual Currency
    return isValidAddress(address, parameters.currencyId as Currency);
  } catch {
    // isValidAddress() will throw Error if parameters.currencyId is not an actual Currency
    return false;
  }
}
