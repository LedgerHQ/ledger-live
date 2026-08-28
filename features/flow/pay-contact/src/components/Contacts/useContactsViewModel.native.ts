import { useMemo } from "react";
import { useContacts } from "@features/platform-contacts";
import type { ContactsNativeProps, ContactsViewNativeProps } from "../../types";

const MAX_CONTACTS_DISPLAYED = 8;

export function useContactsViewModel(props: ContactsNativeProps): ContactsViewNativeProps {
  const contacts = useContacts();
  const savedContacts = useMemo(() => contacts.filter(contact => !contact.isMe), [contacts]);
  const hasMore = savedContacts.length > MAX_CONTACTS_DISPLAYED;
  const displayedContacts = useMemo(
    () => savedContacts.slice(0, MAX_CONTACTS_DISPLAYED),
    [savedContacts],
  );

  return { ...props, contacts: displayedContacts, hasMore };
}
