import { useMemo } from "react";
import { v4 as uuid } from "uuid";
import {
  addContact,
  contact,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { type AddContactAppAdapterResult, useAddContactAppAdapter } from "@features/flow-contacts";
import type { ContactCreationPort } from "@features/flow-contacts-add-contact";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useContactsAnalytics } from "../../../analytics/useContactsAnalytics";

export function useContactsAddContactDrawerAdapter(
  onSaveSuccess: () => void,
): AddContactAppAdapterResult {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const contactCreation = useMemo<ContactCreationPort>(
    () => ({
      createContact: async ({ name }) => {
        const createdContact = contact({
          id: `contact-${uuid()}`,
          isMe: false,
          name,
          addresses: [],
        });

        dispatch(addContact(createdContact));

        return createdContact;
      },
    }),
    [dispatch],
  );
  const labels = useMemo(
    () => ({
      title: t("contacts.addContact"),
      namePlaceholder: t("contacts.addContactDrawer.namePlaceholder"),
      namingDisclaimer: t("contacts.addContactDrawer.namingDisclaimer"),
      confirmName: t("contacts.addContactDrawer.confirmName"),
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
