import type { ContactId } from "@domain/entity-contact";

export type ContactsListItem = Readonly<{
  contactId: ContactId;
  name: string;
  initial: string;
  addressCount: number;
}>;

export type EmptyContactsListViewModel = Readonly<{
  me: ContactsListItem;
}>;
