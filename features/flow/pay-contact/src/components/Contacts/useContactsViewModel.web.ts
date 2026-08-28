import { useCallback } from "react";
import { useAddContactDialogViewModel } from "@features/flow-contacts-add-contact";
import { useContacts } from "@features/platform-contacts";
import type { ContactsProps, ContactsViewProps } from "../../types";

const noop = () => undefined;

export function useContactsViewModel({
  title,
  emptyState,
  addContact,
}: ContactsProps): ContactsViewProps {
  const contacts = useContacts();
  const isEmpty = contacts.every(contact => contact.isMe);
  const { labels, contactCreation, onRequestAddContact, onSaveSuccess, callbacks } = addContact;
  const addContactDialog = useAddContactDialogViewModel({
    contactCreation,
    labels,
    onSaveSuccess: onSaveSuccess ?? noop,
    callbacks,
  });
  const onAddContact = useCallback(
    () => onRequestAddContact(addContactDialog.onOpen),
    [addContactDialog.onOpen, onRequestAddContact],
  );

  return {
    title,
    isEmpty,
    emptyState: { ...emptyState, onAddContact },
    addContactDialog,
  };
}
