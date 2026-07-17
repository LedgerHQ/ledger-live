import type { Contact } from "@domain/entity-contact";
import type {
  ContactsSearchViewModel,
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

function createSavedContactsListItems(contacts: readonly Contact[], normalizedQuery = "") {
  return contacts
    .filter(
      contact =>
        !contact.isMe &&
        (normalizedQuery.length === 0 || contact.name.toLowerCase().includes(normalizedQuery)),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(createContactsListItem);
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
    savedContacts: createSavedContactsListItems(contacts),
  };
}

export function createContactsSearchViewModel(
  me: Contact,
  contacts: readonly Contact[],
  query: string,
): ContactsSearchViewModel {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return {
      status: "results",
      ...createPopulatedContactsListViewModel(me, contacts),
    };
  }

  const savedContacts = createSavedContactsListItems(contacts, normalizedQuery);

  if (savedContacts.length === 0) {
    return {
      status: "no-results",
      ...createEmptyContactsListViewModel(me),
    };
  }

  return {
    status: "results",
    me: createContactsListItem(me),
    savedContacts,
  };
}
