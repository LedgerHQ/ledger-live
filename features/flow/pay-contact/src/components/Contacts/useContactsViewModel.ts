import { useMemo } from "react";
import { useContacts } from "@features/platform-contacts";

export function useContactsViewModel(): Readonly<{ isEmpty: boolean }> {
  const contacts = useContacts();

  return useMemo(() => ({ isEmpty: contacts.every(contact => contact.isMe) }), [contacts]);
}
