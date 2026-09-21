import type { Contact } from "@domain/entity-contact";

export function placeMeFirst(contacts: readonly Contact[]): Contact[] {
  const others: Contact[] = [];
  const me: Contact[] = [];

  for (const contact of contacts) {
    if (contact.isMe) {
      me.push(contact);
    } else {
      others.push(contact);
    }
  }

  return [...me, ...others];
}
