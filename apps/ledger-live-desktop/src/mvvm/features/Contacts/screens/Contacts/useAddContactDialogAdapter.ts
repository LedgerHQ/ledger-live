import {
  addContact,
  contact,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import {
  type ContactCreationPort,
  type ContactsAddContactDialogLabels,
  type ContactsAddContactDialogProps,
  useAddContactDrawerViewModel,
} from "@features/flow-contacts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { useDispatch } from "LLD/hooks/redux";

export function useAddContactDialogAdapter(
  onSaveSuccess: () => void,
): ContactsAddContactDialogProps {
  const dispatch = useDispatch();
  const { t } = useTranslation();
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
  const dialogViewModel = useAddContactDrawerViewModel({ contactCreation, onSaveSuccess });
  const labels = useMemo<ContactsAddContactDialogLabels>(
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

  return {
    ...dialogViewModel,
    labels,
  };
}
