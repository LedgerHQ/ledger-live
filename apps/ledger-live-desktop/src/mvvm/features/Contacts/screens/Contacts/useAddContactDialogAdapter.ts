import {
  type Contact,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { type AddContactAppAdapterResult, useAddContactAppAdapter } from "@features/flow-contacts";
import { createContactCreationPort } from "@features/flow-contacts-add-contact";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { useDispatch } from "LLD/hooks/redux";
import { useContactsAnalytics } from "../../analytics";

export function useAddContactDialogAdapter(
  onSaveSuccess: (contact: Contact) => void,
): AddContactAppAdapterResult {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const contactCreation = useMemo(
    () => createContactCreationPort({ dispatch, generateId: uuid }),
    [dispatch],
  );
  const labels = useMemo(
    () => ({
      title: t("contacts.addContact"),
      namePlaceholder: t("contacts.addContactDrawer.namePlaceholder"),
      namingDisclaimer: t("contacts.addContactDrawer.namingDisclaimer"),
      confirmName: t("contacts.addContact"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.invalidNameError"),
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
      },
    }),
    [t],
  );

  return useAddContactAppAdapter({
    analytics,
    contactCreation,
    onSaveSuccess,
    labels,
  });
}
