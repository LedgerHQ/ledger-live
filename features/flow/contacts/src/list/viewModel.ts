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

export function createContactsSearchViewModel(
  me: Contact,
  contacts: readonly Contact[],
  query: string,
): ContactsSearchViewModel {
  const populatedList = createPopulatedContactsListViewModel(me, contacts);
  const normalizedQuery = query.trim().toLowerCase();
  const savedContacts = normalizedQuery
    ? populatedList.savedContacts.filter(contact =>
        contact.name.toLowerCase().includes(normalizedQuery),
      )
    : populatedList.savedContacts;

  if (normalizedQuery && savedContacts.length === 0) {
    return {
      status: "no-results",
      me: populatedList.me,
    };
  }

  return {
    status: "results",
    me: populatedList.me,
    savedContacts,
  };
}
