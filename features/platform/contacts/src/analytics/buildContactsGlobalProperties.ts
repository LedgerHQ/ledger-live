import type { Contact } from "@domain/entity-contact";
import type { ContactsGlobalProperties } from "./contactsGlobalProperties";

export type BuildContactsGlobalPropertiesInput = Readonly<{
  ffAddressBookEnabled: boolean;
  contacts: readonly Contact[];
}>;

export function buildContactsGlobalProperties(
  input: BuildContactsGlobalPropertiesInput,
): ContactsGlobalProperties {
  const meContact = input.contacts.find(contact => contact.isMe);
  const savedContacts = input.contacts.filter(contact => !contact.isMe);
  const externalAddressesSavedCount = savedContacts.reduce(
    (count, contact) => count + contact.addresses.length,
    0,
  );

  return {
    ffAddressBookEnabled: input.ffAddressBookEnabled,
    contactsCount: savedContacts.length,
    externalAddressesSavedCount,
    myAddressesSavedCount: meContact?.addresses.length ?? 0,
  };
}
