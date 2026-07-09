import type { Contact } from "@domain/entity-contact";

export type ContactsListState = Readonly<{
  me: Contact;
  contacts: readonly Contact[];
  query: string;
  isEmpty: boolean;
  hasResults: boolean;
}>;

export type ContactsListPort = Readonly<{
  loadContactsList(query?: string): Promise<ContactsListState>;
}>;
