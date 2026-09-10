import type { Contact } from "@domain/entity-contact";

export function getCompactContactAddressDescription(
  contact: Contact,
  emptyAddress: string,
  formatAddressCount: (count: number) => string,
): string {
  if (contact.addresses.length === 0) {
    return emptyAddress;
  }

  if (contact.addresses.length === 1) {
    return contact.addresses[0].label;
  }

  return formatAddressCount(contact.addresses.length);
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
