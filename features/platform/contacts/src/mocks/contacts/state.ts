import { mockMeContact } from "@domain/entity-contact/schema.mock";
import type { Contact, ContactId } from "@domain/entity-contact";

export function createContactsMap(contacts: readonly Contact[]): Map<ContactId, Contact> {
  const contactsMap = new Map<ContactId, Contact>(contacts.map(contact => [contact.id, contact]));

  ensureMeContact(contactsMap);

  return contactsMap;
}

export function getMeContact(contacts: Map<ContactId, Contact>): Contact {
  return ensureMeContact(contacts);
}

function ensureMeContact(contacts: Map<ContactId, Contact>): Contact {
  const existingMeContact = [...contacts.values()].find(contact => contact.isMe);

  if (existingMeContact) {
    return existingMeContact;
  }

  const meContact = mockMeContact();
  contacts.set(meContact.id, meContact);

  return meContact;
}
