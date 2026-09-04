import { useMemo } from "react";
import {
  sortContactsByLastSentThenLastAdded,
  summarizeOutgoingOperationsByContact,
  useContacts,
} from "@features/platform-contacts";
import type { ContactsNativeProps, ContactsViewNativeProps } from "../../types";

const MAX_CONTACTS_DISPLAYED = 8;

const EMPTY_OPERATIONS = [] as const;

export function useContactsViewModel({
  outgoingOperations = EMPTY_OPERATIONS,
  ...props
}: ContactsNativeProps): ContactsViewNativeProps {
  const contacts = useContacts();
  const sortedContacts = useMemo(() => {
    const savedContacts = contacts.filter(contact => !contact.isMe);
    const summaries = summarizeOutgoingOperationsByContact(savedContacts, outgoingOperations);

    return sortContactsByLastSentThenLastAdded(savedContacts, summaries);
  }, [contacts, outgoingOperations]);

  const hasMore = sortedContacts.length > MAX_CONTACTS_DISPLAYED;
  const displayedContacts = useMemo(
    () => sortedContacts.slice(0, MAX_CONTACTS_DISPLAYED),
    [sortedContacts],
  );

  return { ...props, contacts: displayedContacts, hasMore };
}
