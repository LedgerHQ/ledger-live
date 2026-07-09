import type { ContactId, ContactName } from "@domain/entity-contact";

export type ContactsListStatus = "empty" | "results" | "no-results";

export type ContactListItem = Readonly<{
  id: ContactId;
  isMe: boolean;
  name: ContactName;
  addressCount: number;
}>;

export type ContactsListState = Readonly<{
  me: ContactListItem;
  contacts: readonly ContactListItem[];
  status: ContactsListStatus;
}>;

export type ContactsListPort = Readonly<{
  loadContactsList(query?: string): Promise<ContactsListState>;
}>;
