import type { ContactsAddAddressReviewProps, ContactsAddAddressReviewViewProps } from "./types";

export function useContactsAddAddressReviewViewModel({
  addressEntry,
  addressLabel,
  displayContext,
  labels,
  onContinue,
}: ContactsAddAddressReviewProps): ContactsAddAddressReviewViewProps {
  return {
    address: addressEntry.resolvedAddress,
    currency: displayContext.assetDisplayName,
    network: displayContext.network.displayName,
    name: addressLabel.label,
    labels,
    onContinue,
  };
}
