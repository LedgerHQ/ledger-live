import { useMemo } from "react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

export function useEditContactLabels() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.editContact.title"),
      namePlaceholder: t("contacts.editContact.namePlaceholder"),
      namingDisclaimer: t("contacts.editContact.namingDisclaimer"),
      applyChanges: t("contacts.editContact.applyChanges"),
      confirmName: t("contacts.editContact.confirmName"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.editContact.invalidNameError"),
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
      },
    }),
    [t],
  );
}
