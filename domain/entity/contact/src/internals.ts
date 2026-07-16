import type { Contact } from "./types";

export function normalizeContacts(
  currentContacts: readonly Contact[],
  incomingContacts: readonly Contact[],
  fallbackMeContact: Contact,
): Contact[] {
  const nextMe =
    incomingContacts.find(contact => contact.isMe) ??
    currentContacts.find(contact => contact.isMe) ??
    fallbackMeContact;

  return [nextMe, ...incomingContacts.filter(contact => !contact.isMe && contact.id !== nextMe.id)];
}
