import { useMemo } from "react";
import { v4 as uuid } from "uuid";
import { addContact, contact } from "@domain/entity-contact";
import {
  type ContactCreationPort,
  type ContactsAddContactDrawerLabels,
  type ContactsAddContactDrawerProps,
  useAddContactDrawerViewModel,
} from "@features/flow-contacts";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";

export function useContactsAddContactDrawerViewModel(
  onSaveSuccess: () => void,
): ContactsAddContactDrawerProps {
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
  const drawerViewModel = useAddContactDrawerViewModel({ contactCreation, onSaveSuccess });
  const labels = useMemo<ContactsAddContactDrawerLabels>(
    () => ({
      title: t("contacts.addContact"),
      namePlaceholder: t("contacts.addContactDrawer.namePlaceholder"),
      namingDisclaimer: t("contacts.addContactDrawer.namingDisclaimer"),
      confirmName: t("contacts.addContactDrawer.confirmName"),
    }),
    [t],
  );

  return {
    ...drawerViewModel,
    labels,
  };
}
