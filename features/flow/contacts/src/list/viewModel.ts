import type { Contact } from "@domain/entity-contact";
import type { ContactsListItem, EmptyContactsListViewModel } from "./types";

function createContactsListItem(contact: Contact): ContactsListItem {
  return {
    contactId: contact.id,
    name: contact.name,
    initial: contact.name.slice(0, 1).toUpperCase(),
    addressCount: contact.addresses.length,
  };
}

export function createEmptyContactsListViewModel(me: Contact): EmptyContactsListViewModel {
  return {
    me: createContactsListItem(me),
  };
}
