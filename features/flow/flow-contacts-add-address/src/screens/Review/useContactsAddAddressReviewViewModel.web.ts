import { useAddAddressReviewLabels } from "../../copy/useAddAddressReviewLabels";
import type { ContactsAddAddressReviewProps } from "./types";
import type { ContactsAddAddressReviewViewProps } from "./ContactsAddAddressReviewView";

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
