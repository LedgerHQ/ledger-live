import type { Contact } from "@domain/entity-contact";
import { getContactInitial } from "@features/platform-contacts";
import type {
  ContactsSearchViewModel,
  ContactsListItem,
  EmptyContactsListViewModel,
  PopulatedContactsListViewModel,
} from "../types";
import { createContactsListSections } from "../utils";

export type GetContactDisplayName = (contact: Contact) => string;

function createContactsListItem(contact: Contact): ContactsListItem {
  return {
    contactId: contact.id,
    name: contact.name,
    isMe: contact.isMe,
    initial: getContactInitial(contact.name),
    addressCount: contact.addresses.length,
  };
}

function createSavedContactsListItems(contacts: readonly Contact[], normalizedQuery = "") {
  return contacts
    .filter(
      contact =>
        !contact.isMe &&
        (normalizedQuery.length === 0 || isContactNameMatching(contact, normalizedQuery)),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(createContactsListItem);
}

function isContactNameMatching(contact: Contact, normalizedQuery: string): boolean {
  return contact.name.toLowerCase().includes(normalizedQuery);
}

function isMeContactMatching(
  me: Contact,
  normalizedQuery: string,
  getDisplayName: GetContactDisplayName,
): boolean {
  return (
    getDisplayName(me).toLowerCase().includes(normalizedQuery) ||
    me.name.toLowerCase().includes(normalizedQuery)
  );
}

export function createEmptyContactsListViewModel(me: Contact): EmptyContactsListViewModel {
  return {
    displayMode: "empty",
    me: createContactsListItem(me),
  };
}

function createPopulatedContactsListViewModelFromSavedContacts(
  me: Contact,
  savedContacts: readonly ContactsListItem[],
): PopulatedContactsListViewModel {
  return {
    displayMode: "populated",
    me: createContactsListItem(me),
    savedContacts,
    sections: createContactsListSections(savedContacts),
  };
}

export function createPopulatedContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
): PopulatedContactsListViewModel {
  return createPopulatedContactsListViewModelFromSavedContacts(
    me,
    createSavedContactsListItems(contacts),
  );
}

export function createContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
): EmptyContactsListViewModel | PopulatedContactsListViewModel {
  const savedContacts = createSavedContactsListItems(contacts);

  if (savedContacts.length > 0) {
    return createPopulatedContactsListViewModelFromSavedContacts(me, savedContacts);
  }

  return createEmptyContactsListViewModel(me);
}

/** `getDisplayName` lets the query match what the user sees, e.g. "addresses" finds Me. */
export function createContactsSearchViewModel(
  me: Contact,
  contacts: readonly Contact[],
  query: string,
  getDisplayName: GetContactDisplayName,
): ContactsSearchViewModel {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return {
      status: "results",
      ...createPopulatedContactsListViewModel(me, contacts),
    };
  }

  const savedContacts = createSavedContactsListItems(contacts, normalizedQuery);
  const matchingMe = isMeContactMatching(me, normalizedQuery, getDisplayName)
    ? createContactsListItem(me)
    : undefined;

  if (savedContacts.length === 0 && !matchingMe) {
    return {
      status: "no-results",
      displayMode: "empty",
    };
  }

  return {
    status: "results",
    displayMode: "populated",
    ...(matchingMe ? { me: matchingMe } : {}),
    savedContacts,
    sections: createContactsListSections(savedContacts),
  };
}
