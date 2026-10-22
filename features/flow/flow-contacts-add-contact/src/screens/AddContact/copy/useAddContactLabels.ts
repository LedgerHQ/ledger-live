import { useMemo } from "react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

export function useAddContactLabels() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.addContact"),
      namePlaceholder: t("contacts.addContactDrawer.namePlaceholder"),
      namingDisclaimer: t("contacts.addContactDrawer.namingDisclaimer"),
      confirmAddContact: t("contacts.addContact"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.invalidNameError"),
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
      },
    }),
    [t],
  );
}
