import { useAddAddressReviewLabels } from "../../copy/useAddAddressReviewLabels";
import type { ContactsAddAddressReviewProps, ContactsAddAddressReviewViewProps } from "./types";

export function useContactsAddAddressReviewViewModel({
  addressEntry,
  addressLabel,
  displayContext,
  onContinue,
}: ContactsAddAddressReviewProps): ContactsAddAddressReviewViewProps {
  const labels = useAddAddressReviewLabels();

  return {
    address: addressEntry.resolvedAddress,
    currency: displayContext.assetDisplayName,
    network: displayContext.network.displayName,
    name: addressLabel.label,
    labels,
    onContinue,
  };
}
