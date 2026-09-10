import type { ContactsAddAddressReviewProps, ContactsAddAddressReviewViewProps } from "./types";
import { useTranslation } from "@shared/i18n";

export function useContactsAddAddressReviewViewModel({
  addressEntry,
  addressLabel,
  displayContext,
  onContinue,
}: ContactsAddAddressReviewProps): ContactsAddAddressReviewViewProps {
  const { t } = useTranslation();
  return {
    address: addressEntry.resolvedAddress,
    currency: displayContext.assetDisplayName,
    network: displayContext.network.displayName,
    name: addressLabel.label,
    labels: {
      title: t("contacts.addAddressReview.title"),
      addressLabel: t("contacts.addAddressReview.addressLabel"),
      currencyLabel: t("contacts.addAddressReview.currencyLabel"),
      networkLabel: t("contacts.addAddressReview.networkLabel"),
      nameLabel: t("contacts.addAddressReview.nameLabel"),
      continue: t("contacts.addAddressReview.continue"),
    },
    onContinue,
  };
}
