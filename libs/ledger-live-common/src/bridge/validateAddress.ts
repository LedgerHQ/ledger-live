import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

export const isInvalidRecipient = (recipient: string) => {
  if (recipient.includes("criticalcrash")) throw new Error("isInvalidRecipient_mock_criticalcrash");
  return recipient.includes("invalid") || recipient.length <= 3;
};

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isInvalidRecipient(address);
}
