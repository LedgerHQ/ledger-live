import { useCallback, useMemo } from "react";
import { useAddContactDialogViewModel } from "@features/flow-contacts-add-contact";
import {
  sortContactsByLastSentThenLastAdded,
  summarizeContactOperationsByContact,
  useContacts,
} from "@features/platform-contacts";
import type { ContactRowViewModel, ContactsProps, ContactsViewProps } from "../../types";

const noop = () => undefined;
const EMPTY_OPERATIONS = [] as const;

export function useContactsViewModel({
  emptyState,
  addContact,
  operations = EMPTY_OPERATIONS,
  ...props
}: ContactsProps): ContactsViewProps {
  const contacts = useContacts();
  const rows = useMemo<readonly ContactRowViewModel[]>(() => {
    const savedContacts = contacts.filter(contact => !contact.isMe);
    const summaries = summarizeContactOperationsByContact(savedContacts, operations);

    return sortContactsByLastSentThenLastAdded(savedContacts, summaries).map(contact => ({
      contact,
      transactionCount: summaries[contact.id]?.txCount ?? 0,
    }));
  }, [contacts, operations]);
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
    ...props,
    isEmpty: rows.length === 0,
    rows,
    emptyState: { ...emptyState, onAddContact },
    addContactDialog,
  };
}
