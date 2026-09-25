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

function createContactsListItem(
  contact: Contact,
  getDisplayName: GetContactDisplayName,
): ContactsListItem {
  return {
    contactId: contact.id,
    name: getDisplayName(contact),
    initial: getContactInitial(contact.name),
    addressCount: contact.addresses.length,
  };
}

function createSavedContactsListItems(
  contacts: readonly Contact[],
  normalizedQuery: string,
  getDisplayName: GetContactDisplayName,
) {
  return contacts
    .filter(
      contact =>
        !contact.isMe &&
        (normalizedQuery.length === 0 || isContactNameMatching(contact, normalizedQuery)),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(contact => createContactsListItem(contact, getDisplayName));
}

function isContactNameMatching(contact: Contact, normalizedQuery: string): boolean {
  return contact.name.toLowerCase().includes(normalizedQuery);
}

function isMeContactMatching(
  me: Contact,
  normalizedQuery: string,
  getDisplayName: GetContactDisplayName,
): boolean {
  const displayName = getDisplayName(me);

  return (
    displayName.toLowerCase().includes(normalizedQuery) ||
    me.name.toLowerCase().includes(normalizedQuery)
  );
}

export function createEmptyContactsListViewModel(
  me: Contact,
  getDisplayName: GetContactDisplayName,
): EmptyContactsListViewModel {
  return {
    displayMode: "empty",
    me: createContactsListItem(me, getDisplayName),
  };
}

function createPopulatedContactsListViewModelFromSavedContacts(
  me: Contact,
  savedContacts: readonly ContactsListItem[],
  getDisplayName: GetContactDisplayName,
): PopulatedContactsListViewModel {
  return {
    displayMode: "populated",
    me: createContactsListItem(me, getDisplayName),
    savedContacts,
    sections: createContactsListSections(savedContacts),
  };
}

export function createPopulatedContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
  getDisplayName: GetContactDisplayName,
): PopulatedContactsListViewModel {
  return createPopulatedContactsListViewModelFromSavedContacts(
    me,
    createSavedContactsListItems(contacts, "", getDisplayName),
    getDisplayName,
  );
}

export function createContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
  getDisplayName: GetContactDisplayName,
): EmptyContactsListViewModel | PopulatedContactsListViewModel {
  const savedContacts = createSavedContactsListItems(contacts, "", getDisplayName);

  if (savedContacts.length > 0) {
    return createPopulatedContactsListViewModelFromSavedContacts(me, savedContacts, getDisplayName);
  }

  return createEmptyContactsListViewModel(me, getDisplayName);
}

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
      ...createPopulatedContactsListViewModel(me, contacts, getDisplayName),
    };
  }

  const savedContacts = createSavedContactsListItems(contacts, normalizedQuery, getDisplayName);
  const matchingMe = isMeContactMatching(me, normalizedQuery, getDisplayName)
    ? createContactsListItem(me, getDisplayName)
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
