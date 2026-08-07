import type { Contact } from "@domain/entity-contact";
import { getNameInitial } from "@shared/name";
import type {
  ContactsSearchViewModel,
  ContactsListItem,
  EmptyContactsListViewModel,
  PopulatedContactsListViewModel,
} from "../types";
import { identityFormatMeDisplayName, resolveMeContactDisplayName } from "../../../utils";
import { createContactsListSections } from "../utils";

function createContactsListItem(
  contact: Contact,
  formatMeDisplayName?: (name: string) => string,
): ContactsListItem {
  const formatName = formatMeDisplayName ?? identityFormatMeDisplayName;

  return {
    contactId: contact.id,
    name: resolveMeContactDisplayName(contact, formatName),
    initial: getNameInitial(contact.name),
    addressCount: contact.addresses.length,
  };
}

function createSavedContactsListItems(
  contacts: readonly Contact[],
  normalizedQuery = "",
  formatMeDisplayName?: (name: string) => string,
) {
  return contacts
    .filter(
      contact =>
        !contact.isMe &&
        (normalizedQuery.length === 0 || isContactNameMatching(contact, normalizedQuery)),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(contact => createContactsListItem(contact, formatMeDisplayName));
}

function isContactNameMatching(contact: Contact, normalizedQuery: string): boolean {
  return contact.name.toLowerCase().includes(normalizedQuery);
}

function isMeContactMatching(
  me: Contact,
  normalizedQuery: string,
  formatMeDisplayName?: (name: string) => string,
): boolean {
  const formatName = formatMeDisplayName ?? identityFormatMeDisplayName;
  const displayName = resolveMeContactDisplayName(me, formatName);

  return displayName.toLowerCase().includes(normalizedQuery);
}

export function createEmptyContactsListViewModel(
  me: Contact,
  formatMeDisplayName?: (name: string) => string,
): EmptyContactsListViewModel {
  return {
    displayMode: "empty",
    me: createContactsListItem(me, formatMeDisplayName),
  };
}

function createPopulatedContactsListViewModelFromSavedContacts(
  me: Contact,
  savedContacts: readonly ContactsListItem[],
  formatMeDisplayName?: (name: string) => string,
): PopulatedContactsListViewModel {
  return {
    displayMode: "populated",
    me: createContactsListItem(me, formatMeDisplayName),
    savedContacts,
    sections: createContactsListSections(savedContacts),
  };
}

export function createPopulatedContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
  formatMeDisplayName?: (name: string) => string,
): PopulatedContactsListViewModel {
  return createPopulatedContactsListViewModelFromSavedContacts(
    me,
    createSavedContactsListItems(contacts, "", formatMeDisplayName),
    formatMeDisplayName,
  );
}

export function createContactsListViewModel(
  me: Contact,
  contacts: readonly Contact[],
  formatMeDisplayName?: (name: string) => string,
): EmptyContactsListViewModel | PopulatedContactsListViewModel {
  const savedContacts = createSavedContactsListItems(contacts, "", formatMeDisplayName);

  if (savedContacts.length > 0) {
    return createPopulatedContactsListViewModelFromSavedContacts(
      me,
      savedContacts,
      formatMeDisplayName,
    );
  }

  return createEmptyContactsListViewModel(me, formatMeDisplayName);
}

export function createContactsSearchViewModel(
  me: Contact,
  contacts: readonly Contact[],
  query: string,
  formatMeDisplayName?: (name: string) => string,
): ContactsSearchViewModel {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return {
      status: "results",
      ...createPopulatedContactsListViewModel(me, contacts, formatMeDisplayName),
    };
  }

  const savedContacts = createSavedContactsListItems(
    contacts,
    normalizedQuery,
    formatMeDisplayName,
  );
  const matchingMe = isMeContactMatching(me, normalizedQuery, formatMeDisplayName)
    ? createContactsListItem(me, formatMeDisplayName)
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
