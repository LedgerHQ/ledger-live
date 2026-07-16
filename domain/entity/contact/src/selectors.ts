import type { Contact, ContactId, ContactsState } from "./types";

type ContactsStateRoot = {
  contacts: ContactsState;
};

export function selectContacts(state: ContactsStateRoot): Contact[] {
  return state.contacts.contacts;
}

export function selectMeContact(state: ContactsStateRoot): Contact | undefined {
  return selectContacts(state).find(contact => contact.isMe);
}

export function selectContactById(
  state: ContactsStateRoot,
  contactId: ContactId,
): Contact | undefined {
  return selectContacts(state).find(contact => contact.id === contactId);
}
