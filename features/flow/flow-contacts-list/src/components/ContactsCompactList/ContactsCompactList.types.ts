import type { Contact } from "@domain/entity-contact";

export type ContactsCompactListProps = Readonly<{
  contacts: readonly Contact[];
  maxContacts?: number;
  onSelectContact: (contact: Contact) => void;
  testID?: string;
}>;
