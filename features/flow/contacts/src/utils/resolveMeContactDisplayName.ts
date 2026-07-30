import type { Contact } from "@domain/entity-contact";
import { DEFAULT_ME_CONTACT_NAME } from "./constants";

export function resolveMeContactDisplayName(
  contact: Contact,
  formatWithMeSuffix: (name: string) => string,
): string {
  if (!contact.isMe) {
    return contact.name;
  }

  if (contact.name === DEFAULT_ME_CONTACT_NAME) {
    return DEFAULT_ME_CONTACT_NAME;
  }

  return formatWithMeSuffix(contact.name);
}
