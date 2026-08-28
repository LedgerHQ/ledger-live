import { useMemo } from "react";
import { useContacts } from "@features/platform-contacts";
import type { ContactsNativeProps, ContactsViewNativeProps } from "../../types";

export function useContactsViewModel(props: ContactsNativeProps): ContactsViewNativeProps {
  const contacts = useContacts();
  const savedContacts = useMemo(() => contacts.filter(contact => !contact.isMe), [contacts]);

  return { ...props, contacts: savedContacts };
}
