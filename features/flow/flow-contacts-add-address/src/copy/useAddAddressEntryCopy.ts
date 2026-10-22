import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { AddAddressEntryLabels } from "./addAddressEntryLabels";

export type AddAddressEntryCopy = Readonly<{
  labels: AddAddressEntryLabels;
  sanctionedDescription: string;
  sanctionedLearnMore: string;
}>;

export function useAddAddressEntryCopy(supportsDomain: boolean): AddAddressEntryCopy {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      labels: {
        title: t("contacts.addAddressEntry.title"),
        addressPlaceholder: t(
          supportsDomain
            ? "contacts.addAddressEntry.addressPlaceholder"
            : "contacts.addAddressEntry.addressPlaceholderNoENS",
        ),
        confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
        validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
        validAddress: t("contacts.addAddressEntry.validAddress"),
        invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
        domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
        sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
        validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
        ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
        ensDisclaimerDescription: t("contacts.addAddressEntry.ensDisclaimerDescription"),
        duplicateAddress: (contactName: string) =>
          t("contacts.addAddressEntry.duplicateAddress", { contactName }),
      },
      sanctionedDescription: t("contacts.addAddressEntry.sanctioned.description"),
      sanctionedLearnMore: t("contacts.addAddressEntry.sanctioned.learnMore"),
    }),
    [supportsDomain, t],
  );
}
