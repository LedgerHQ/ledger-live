import type { Contact } from "@domain/entity-contact";
import type {
  ContactsListItem,
  EmptyContactsListViewModel,
  PopulatedContactsListViewModel,
} from "./types";
import { getContactInitial } from "./internals";

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

export function createPopulatedContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
): PopulatedContactsListViewModel {
  return {
    me: createContactsListItem(me),
    savedContacts: contacts
      .filter(contact => !contact.isMe)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(createContactsListItem),
  };
}
