import { useMemo } from "react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

export function useEditAddressLabels(supportsDomain: boolean) {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.editAddress.title"),
      inputLabel: t("contacts.editAddress.inputLabel"),
      applyChanges: t("contacts.editAddress.applyChanges"),
      labelValidationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.editAddress.invalidLabelError"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
      },
      addressValidation: {
        addressPlaceholder: t(
          supportsDomain
            ? "contacts.addAddressEntry.addressPlaceholder"
            : "contacts.addAddressEntry.addressPlaceholderNoENS",
        ),
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
    }),
    [supportsDomain, t],
  );
}
