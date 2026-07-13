import type { Contact } from "@domain/entity-contact";
import type { ContactsListItem, EmptyContactsListViewModel } from "./types";
import { getContactInitial } from "./utils/getContactInitial";

function createContactsListItem(contact: Contact): ContactsListItem {
  return {
    contactId: contact.id,
    name: contact.name,
    initial: getContactInitial(contact.name),
    addressCount: contact.addresses.length,
  };
}

export function createEmptyContactsListViewModel(me: Contact): EmptyContactsListViewModel {
  return {
    me: createContactsListItem(me),
  };
}
