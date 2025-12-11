import { validateRecipient } from "./cache";
import { InvalidAddress } from "@ledgerhq/errors";
import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!parameters.currency) {
    throw new Error("Missing currency parameter for address validation on Bitcoin");
  }

  const validation = await validateRecipient(parameters.currency, address);
  if (validation.recipientError && validation.recipientError instanceof InvalidAddress) {
    return false;
  }

  return true;
}
