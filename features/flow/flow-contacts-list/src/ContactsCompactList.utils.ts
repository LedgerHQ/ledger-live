import type { Contact } from "@domain/entity-contact";
import type { ContactsCompactListProps } from "./types";

export function getCompactContactAddressDescription(
  contact: Contact,
  labels: ContactsCompactListProps["labels"],
): string {
  if (contact.addresses.length === 0) {
    return labels.emptyAddress;
  }

  if (contact.addresses.length === 1) {
    return contact.addresses[0].label;
  }

  return labels.formatAddressCount(contact.addresses.length);
}

export function getDisplayedCompactContacts(
  contacts: readonly Contact[],
  maxContacts: ContactsCompactListProps["maxContacts"],
): readonly Contact[] {
  if (maxContacts === undefined) {
    return contacts;
  }

  return contacts.slice(0, Math.max(0, Math.floor(maxContacts)));
}
